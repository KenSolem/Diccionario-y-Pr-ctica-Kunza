/* =========================================================
   Diccionario y Práctica Kunza — Motor Optimizado (app.js)
   Conecta directamente con vocabulary.js (~1,800 términos)
   ========================================================= */

(() => {
    const BATCH_SIZE = 24;
    const QUIZ_LENGTH = 10;
    const GITHUB_REPO = "KenSolem/Diccionario-y-Pr-ctica-Kunza";

    const CATEGORY_LABELS = {
        all: "Todas",
        animales: "Animales",
        cuerpo: "Cuerpo",
        verbos: "Verbos",
        lugares: "Lugares",
        colores: "Colores",
        cosmovision: "Cosmovisión",
        cosas: "Objetos",
        otros: "Otros",
        favorites: "Mis Favoritos"
    };

    // Estado global de la aplicación
    const state = {
        lexicon: [],
        espIndex: new Map(),
        kunzaIndex: new Map(),
        filtered: [],
        renderedCount: 0,
        dictCategory: "all",
        searchQuery: "",
        favorites: new Set(),
        bestStreak: 0,
        // Práctica
        practiceMode: "quiz",
        practiceCategory: "all",
        quizPool: [],
        quizIndex: 0,
        quizScore: 0,
        quizStreak: 0,
        quizTotal: QUIZ_LENGTH,
        // Flashcards
        fcQueue: [],
        fcCurrent: 0,
        // Traductor
        transDir: "es-ku",
        lastTranslationPlain: "",
        // Feedback chat
        fbType: "💡 Nueva idea",
        fbHistory: []
    };

    // Normaliza texto eliminando tildes, apóstrofes y signos para búsquedas rápidas
    function normalizeText(str) {
        if (!str) return "";
        return str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/['’`´]/g, "")
            .trim();
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function getCatLabel(cat) {
        return CATEGORY_LABELS[cat] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "Otros");
    }

    // 1. Pre-procesamiento, deduplicación e indexación en memoria (<10ms)
    function initLexicon() {
        const source =
            typeof vocabulary !== "undefined" && Array.isArray(vocabulary)
                ? vocabulary
                : typeof rawVocabulary !== "undefined" && Array.isArray(rawVocabulary)
                ? rawVocabulary
                : [];

        const seen = new Set();

        source.forEach((entry, idx) => {
            if (!entry || !entry.kunza || !entry.esp) return;

            const kunzaClean = String(entry.kunza).trim();
            const espClean = String(entry.esp).trim();
            const kNorm = normalizeText(kunzaClean);
            const eNorm = normalizeText(espClean);

            const dedupKey = `${kNorm}|${eNorm}`;
            if (seen.has(dedupKey)) return;
            seen.add(dedupKey);

            const item = {
                id: `${kNorm}_${idx}`,
                kunza: kunzaClean,
                esp: espClean,
                cat: entry.cat ? String(entry.cat).toLowerCase() : "otros",
                kNorm,
                eNorm
            };

            state.lexicon.push(item);

            const espParts = espClean
                .replace(/\([^)]*\)/g, "")
                .split(/[,;/]/)
                .map(p => normalizeText(p))
                .filter(Boolean);

            espParts.forEach(part => {
                if (!state.espIndex.has(part)) {
                    state.espIndex.set(part, item);
                }
            });

            const kunzaParts = kunzaClean
                .replace(/\([^)]*\)/g, "")
                .split(/[,;/]/)
                .map(p => normalizeText(p))
                .filter(Boolean);

            kunzaParts.forEach(part => {
                if (!state.kunzaIndex.has(part)) {
                    state.kunzaIndex.set(part, item);
                }
            });
        });

        state.lexicon.sort((a, b) => a.kunza.localeCompare(b.kunza, "es"));
    }

    // 2. Persistencia local (tema, favoritos, mejor racha, historial de chat)
    function loadStorage() {
        const savedTheme = localStorage.getItem("kunza_theme") || "light";
        applyTheme(savedTheme);

        try {
            const savedFavs = JSON.parse(localStorage.getItem("kunza_favorites") || "[]");
            if (Array.isArray(savedFavs)) {
                state.favorites = new Set(savedFavs);
            }
        } catch {
            state.favorites = new Set();
        }

        try {
            const savedFb = JSON.parse(localStorage.getItem("kunza_feedback_history") || "[]");
            if (Array.isArray(savedFb)) {
                state.fbHistory = savedFb;
            }
        } catch {
            state.fbHistory = [];
        }

        state.bestStreak = parseInt(localStorage.getItem("kunza_best_streak") || "0", 10) || 0;
        document.getElementById("bestStreakDisplay").textContent = state.bestStreak;
        updateFavBadges();
    }

    function saveFavorites() {
        localStorage.setItem("kunza_favorites", JSON.stringify([...state.favorites]));
        updateFavBadges();
    }

    function updateFavBadges() {
        const count = state.favorites.size;
        const badge = document.getElementById("favBadgeDesktop");
        if (badge) badge.textContent = count;
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        const icon = document.getElementById("themeIcon");
        if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";
        localStorage.setItem("kunza_theme", theme);
    }

    function toggleFavorite(itemKey) {
        if (state.favorites.has(itemKey)) {
            state.favorites.delete(itemKey);
        } else {
            state.favorites.add(itemKey);
        }
        saveFavorites();
        refreshFavoriteButtons(itemKey);
        renderFavoritesTab();
    }

    function refreshFavoriteButtons(itemKey) {
        const isFav = state.favorites.has(itemKey);
        document.querySelectorAll(`[data-fav-key="${CSS.escape(itemKey)}"]`).forEach(btn => {
            btn.classList.toggle("is-fav", isFav);
            btn.textContent = isFav ? "★" : "☆";
        });
    }

    // 3. Palabra del día
    function renderWordOfDay() {
        if (state.lexicon.length === 0) return;
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const word = state.lexicon[seed % state.lexicon.length];
        const key = `${word.kNorm}|${word.eNorm}`;

        document.getElementById("wodKunza").textContent = word.kunza;
        document.getElementById("wodEsp").textContent = word.esp;
        document.getElementById("wodCat").textContent = getCatLabel(word.cat);

        const btn = document.getElementById("wodFavBtn");
        btn.setAttribute("data-fav-key", key);
        const isFav = state.favorites.has(key);
        btn.classList.toggle("is-fav", isFav);
        btn.textContent = isFav ? "★" : "☆";
        btn.onclick = () => toggleFavorite(key);
    }

    // 4. Módulo Diccionario
    function createVocabCard(item) {
        const key = `${item.kNorm}|${item.eNorm}`;
        const isFav = state.favorites.has(key);

        const card = document.createElement("article");
        card.className = "vocab-card";
        card.innerHTML = `
            <div class="vocab-card-top">
                <div>
                    <h3 class="vocab-kunza">${escapeHtml(item.kunza)}</h3>
                    <p class="vocab-esp">${escapeHtml(item.esp)}</p>
                </div>
                <button class="fav-btn ${isFav ? "is-fav" : ""}" data-fav-key="${escapeHtml(key)}" aria-label="Favorito" title="Guardar en favoritos">
                    ${isFav ? "★" : "☆"}
                </button>
            </div>
            <div class="vocab-card-bottom">
                <span class="cat-pill">${escapeHtml(getCatLabel(item.cat))}</span>
            </div>
        `;

        card.querySelector(".fav-btn").addEventListener("click", () => toggleFavorite(key));
        return card;
    }

    function applyDictionaryFilter() {
        const q = normalizeText(state.searchQuery);

        state.filtered = state.lexicon.filter(item => {
            const catOk = state.dictCategory === "all" || item.cat === state.dictCategory;
            if (!catOk) return false;
            if (!q) return true;
            return item.kNorm.includes(q) || item.eNorm.includes(q);
        });

        state.renderedCount = 0;
        const grid = document.getElementById("vocabGrid");
        grid.innerHTML = "";

        const meta = document.getElementById("resultsCount");
        if (state.filtered.length === 0) {
            meta.textContent = "No se encontraron coincidencias.";
            grid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><p>No encontramos términos para "${escapeHtml(state.searchQuery)}". Prueba con otra palabra o categoría.</p></div>`;
            document.getElementById("loadMoreWrap").hidden = true;
            return;
        }

        renderNextBatch();
    }

    function renderNextBatch() {
        const grid = document.getElementById("vocabGrid");
        const slice = state.filtered.slice(state.renderedCount, state.renderedCount + BATCH_SIZE);
        const frag = document.createDocumentFragment();

        slice.forEach(item => frag.appendChild(createVocabCard(item)));
        grid.appendChild(frag);
        state.renderedCount += slice.length;

        const meta = document.getElementById("resultsCount");
        meta.textContent = `Mostrando ${state.renderedCount} de ${state.filtered.length} términos`;

        const loadMoreWrap = document.getElementById("loadMoreWrap");
        loadMoreWrap.hidden = state.renderedCount >= state.filtered.length;
    }

    // 5. Módulo Favoritos
    function renderFavoritesTab() {
        const grid = document.getElementById("favoritesGrid");
        const empty = document.getElementById("favoritesEmpty");
        const practiceBtn = document.getElementById("practiceFavsBtn");

        const favItems = state.lexicon.filter(item => state.favorites.has(`${item.kNorm}|${item.eNorm}`));
        grid.innerHTML = "";

        if (favItems.length === 0) {
            empty.hidden = false;
            practiceBtn.hidden = true;
            return;
        }

        empty.hidden = true;
        practiceBtn.hidden = false;

        const frag = document.createDocumentFragment();
        favItems.forEach(item => frag.appendChild(createVocabCard(item)));
        grid.appendChild(frag);
    }

    // 6. Módulo Práctica (Quiz con pista + Flashcards 3D)
    function getPracticePool() {
        if (state.practiceCategory === "all") return [...state.lexicon];
        if (state.practiceCategory === "favorites") {
            return state.lexicon.filter(item => state.favorites.has(`${item.kNorm}|${item.eNorm}`));
        }
        return state.lexicon.filter(item => item.cat === state.practiceCategory);
    }

    function shuffle(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function initPractice() {
        if (state.practiceMode === "quiz") {
            document.getElementById("quizContainer").hidden = false;
            document.getElementById("flashcardsContainer").hidden = true;
            startQuizRound();
        } else {
            document.getElementById("quizContainer").hidden = true;
            document.getElementById("flashcardsContainer").hidden = false;
            startFlashcards();
        }
    }

    function startQuizRound() {
        const pool = getPracticePool();
        const activeView = document.getElementById("quizActiveView");
        const summaryView = document.getElementById("quizSummaryView");
        const emptyMsg = document.getElementById("quizEmptyMsg");

        summaryView.hidden = true;

        if (pool.length < 4) {
            activeView.hidden = true;
            emptyMsg.hidden = false;
            document.getElementById("quizProgressText").textContent = "Sin suficientes palabras";
            document.getElementById("quizProgressBar").style.width = "0%";
            return;
        }

        emptyMsg.hidden = true;
        activeView.hidden = false;

        state.quizPool = shuffle(pool);
        state.quizTotal = Math.min(QUIZ_LENGTH, state.quizPool.length);
        state.quizIndex = 0;
        state.quizScore = 0;
        state.quizStreak = 0;
        document.getElementById("quizStreak").textContent = "0";

        renderQuizQuestion();
    }

    function renderQuizQuestion() {
        const current = state.quizPool[state.quizIndex];
        const askKunzaToEsp = Math.random() < 0.5;

        const progressPct = ((state.quizIndex + 1) / state.quizTotal) * 100;
        document.getElementById("quizProgressText").textContent = `Pregunta ${state.quizIndex + 1} de ${state.quizTotal}`;
        document.getElementById("quizProgressBar").style.width = `${progressPct}%`;

        document.getElementById("quizDirectionTag").textContent = askKunzaToEsp ? "Kunza → Español" : "Español → Kunza";
        document.getElementById("quizHintTag").textContent = `🏷️ Pista: ${getCatLabel(current.cat)}`;
        document.getElementById("quizPrompt").textContent = askKunzaToEsp ? current.kunza : current.esp;

        const distractors = shuffle(state.quizPool.filter(i => i.id !== current.id)).slice(0, 3);
        const options = shuffle([current, ...distractors]);

        const optionsWrap = document.getElementById("quizOptions");
        optionsWrap.innerHTML = "";
        document.getElementById("quizFeedback").textContent = "";
        document.getElementById("nextQuizBtn").hidden = true;

        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "quiz-opt-btn";
            btn.textContent = askKunzaToEsp ? opt.esp : opt.kunza;

            btn.addEventListener("click", () => {
                const isCorrect = opt.id === current.id;
                const feedback = document.getElementById("quizFeedback");

                optionsWrap.querySelectorAll("button").forEach(b => {
                    b.disabled = true;
                    const expectedText = askKunzaToEsp ? current.esp : current.kunza;
                    if (b.textContent === expectedText) {
                        b.classList.add("correct");
                    }
                });

                if (isCorrect) {
                    state.quizScore++;
                    state.quizStreak++;
                    feedback.textContent = "¡Correcto!";
                    feedback.style.color = "var(--secondary)";
                    if (state.quizStreak > state.bestStreak) {
                        state.bestStreak = state.quizStreak;
                        localStorage.setItem("kunza_best_streak", String(state.bestStreak));
                        document.getElementById("bestStreakDisplay").textContent = state.bestStreak;
                    }
                } else {
                    btn.classList.add("wrong");
                    state.quizStreak = 0;
                    const rightAnswer = askKunzaToEsp ? current.esp : current.kunza;
                    feedback.textContent = `Casi. La respuesta correcta es: ${rightAnswer}`;
                    feedback.style.color = "var(--danger)";
                }

                document.getElementById("quizStreak").textContent = String(state.quizStreak);
                const nextBtn = document.getElementById("nextQuizBtn");
                nextBtn.textContent = state.quizIndex + 1 >= state.quizTotal ? "Ver resultados →" : "Siguiente pregunta →";
                nextBtn.hidden = false;
            });

            optionsWrap.appendChild(btn);
        });
    }

    function advanceQuiz() {
        state.quizIndex++;
        if (state.quizIndex >= state.quizTotal) {
            document.getElementById("quizActiveView").hidden = true;
            document.getElementById("quizSummaryView").hidden = false;
            document.getElementById("summaryScore").textContent = String(state.quizScore);
            document.getElementById("summaryTotal").textContent = String(state.quizTotal);
            const ratio = state.quizScore / state.quizTotal;
            document.getElementById("summaryEmoji").textContent = ratio >= 0.8 ? "🏆" : ratio >= 0.5 ? "👏" : "🌵";
        } else {
            renderQuizQuestion();
        }
    }

    function startFlashcards() {
        const pool = getPracticePool();
        const stage = document.getElementById("flashcardStage");
        const controls = document.querySelector(".flashcard-controls");
        const emptyMsg = document.getElementById("fcEmptyMsg");

        if (pool.length === 0) {
            stage.hidden = true;
            controls.hidden = true;
            emptyMsg.hidden = false;
            document.getElementById("fcCounter").textContent = "0 tarjetas";
            document.getElementById("fcCategory").textContent = "-";
            return;
        }

        stage.hidden = false;
        controls.hidden = false;
        emptyMsg.hidden = true;

        state.fcQueue = shuffle(pool);
        state.fcCurrent = 0;
        renderFlashcard();
    }

    function renderFlashcard() {
        const cardEl = document.getElementById("flashcardEl");
        cardEl.classList.remove("flipped");

        const item = state.fcQueue[state.fcCurrent];
        document.getElementById("fcCounter").textContent = `Tarjeta ${state.fcCurrent + 1} de ${state.fcQueue.length}`;
        document.getElementById("fcCategory").textContent = getCatLabel(item.cat);
        document.getElementById("fcFrontText").textContent = item.kunza;
        document.getElementById("fcBackText").textContent = item.esp;
    }

    function nextFlashcard(requeue) {
        if (state.fcQueue.length === 0) return;
        if (requeue) {
            const currentItem = state.fcQueue[state.fcCurrent];
            state.fcQueue.push(currentItem);
        }
        state.fcCurrent = (state.fcCurrent + 1) % state.fcQueue.length;
        renderFlashcard();
    }

    // 7. Módulo Traductor
    function updateTranslatorLabels() {
        const isEsToKu = state.transDir === "es-ku";
        document.getElementById("transDirLabel").textContent = isEsToKu ? "Español → Kunza" : "Kunza → Español";
        document.getElementById("transInputLabel").textContent = isEsToKu ? "Texto en Español:" : "Texto en Kunza:";
        document.getElementById("transOutputLabel").textContent = isEsToKu ? "Resultado en Kunza:" : "Resultado en Español:";
        document.getElementById("translateInput").placeholder = isEsToKu
            ? "Ej: Mi nombre es Gonzalo y tengo un zorro en mi rancho"
            : "Ej: Ack'cka Tchápur'huaqui Turicka";
    }

    function runTranslation() {
        const raw = document.getElementById("translateInput").value.trim();
        const outputEl = document.getElementById("translateOutput");

        if (!raw) {
            outputEl.innerHTML = '<span class="muted">Escribe una oración para traducir...</span>';
            state.lastTranslationPlain = "";
            return;
        }

        const isEsToKu = state.transDir === "es-ku";
        const indexMap = isEsToKu ? state.espIndex : state.kunzaIndex;

        const tokens = raw.split(/(\s+)/);
        const plainParts = [];

        const htmlParts = tokens.map(token => {
            if (/^\s+$/.test(token)) {
                plainParts.push(token);
                return token;
            }

            const matchPunc = token.match(/^([¡¿("'«]*)(.*?)([.,;:!?)\]"»]*)$/);
            const lead = matchPunc ? matchPunc[1] : "";
            const core = matchPunc ? matchPunc[2] : token;
            const trail = matchPunc ? matchPunc[3] : "";

            const norm = normalizeText(core);
            const found = norm ? indexMap.get(norm) : null;

            if (found) {
                const translated = isEsToKu ? found.kunza : found.esp;
                const tooltip = `${found.kunza} ⇄ ${found.esp} (${getCatLabel(found.cat)})`;
                plainParts.push(`${lead}${translated}${trail}`);
                return `${escapeHtml(lead)}<span class="trans-match" title="${escapeHtml(tooltip)}">${escapeHtml(translated)}</span>${escapeHtml(trail)}`;
            } else {
                plainParts.push(token);
                return `<span class="trans-keep" title="Sin coincidencia exacta en el diccionario">${escapeHtml(token)}</span>`;
            }
        });

        state.lastTranslationPlain = plainParts.join("");
        outputEl.innerHTML = htmlParts.join("");
    }

    // 8. Módulo Chat Flotante de Feedback
    function buildGitHubIssueUrl(type, message) {
        const title = encodeURIComponent(`[${type}] Feedback desde la web Kunza`);
        const body = encodeURIComponent(
            `### Tipo de aporte
${type}

### Detalle
${message}

---
*Enviado desde el buzón de sugerencias de Diccionario y Práctica Kunza.*`
        );
        return `https://github.com/${GITHUB_REPO}/issues/new?title=${title}&body=${body}`;
    }

    function renderFeedbackMessages() {
        const container = document.getElementById("fbMessages");
        container.innerHTML = `
            <div class="fb-bubble bot">
                ¡Hola! 👋 ¿Tienes alguna sugerencia, corrección de palabra o idea nueva para la app? Escríbela abajo y ayúdanos a mejorar.
            </div>
        `;

        state.fbHistory.forEach(entry => {
            const userDiv = document.createElement("div");
            userDiv.className = "fb-bubble user";
            userDiv.innerHTML = `<span class="fb-bubble-tag">${escapeHtml(entry.type)}</span>${escapeHtml(entry.text)}`;
            container.appendChild(userDiv);

            const botDiv = document.createElement("div");
            botDiv.className = "fb-bubble bot";
            const issueUrl = buildGitHubIssueUrl(entry.type, entry.text);
            botDiv.innerHTML = `
                ¡Gracias por tu aporte! Para que llegue directo al desarrollador, pulsa el botón para registrarlo en GitHub:
                <br>
                <a class="fb-action-link" href="${issueUrl}" target="_blank" rel="noopener noreferrer">📤 Enviar a GitHub</a>
            `;
            container.appendChild(botDiv);
        });

        container.scrollTop = container.scrollHeight;
    }

    // 9. Navegación y Eventos
    function switchTab(tabId) {
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        document.getElementById(`tab-${tabId}`).classList.add("active");

        document.querySelectorAll(".nav-tab, .mobile-nav-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.tab === tabId);
        });

        if (tabId === "favorites") renderFavoritesTab();
        if (tabId === "practice" && state.quizPool.length === 0 && state.fcQueue.length === 0) {
            initPractice();
        }
    }

    function bindEvents() {
        // Tema
        document.getElementById("themeToggle").addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme");
            applyTheme(current === "dark" ? "light" : "dark");
        });

        // Navegación
        document.querySelectorAll(".nav-tab, .mobile-nav-btn").forEach(btn => {
            btn.addEventListener("click", () => switchTab(btn.dataset.tab));
        });

        // Buscador con debounce
        let debounceTimer;
        const searchInput = document.getElementById("searchInput");
        const clearSearchBtn = document.getElementById("clearSearchBtn");

        searchInput.addEventListener("input", () => {
            state.searchQuery = searchInput.value;
            clearSearchBtn.hidden = !state.searchQuery;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyDictionaryFilter, 150);
        });

        clearSearchBtn.addEventListener("click", () => {
            searchInput.value = "";
            state.searchQuery = "";
            clearSearchBtn.hidden = true;
            applyDictionaryFilter();
            searchInput.focus();
        });

        // Chips Diccionario
        document.getElementById("dictCategoryChips").addEventListener("click", e => {
            const chip = e.target.closest(".chip");
            if (!chip) return;
            document.querySelectorAll("#dictCategoryChips .chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            state.dictCategory = chip.dataset.cat;
            applyDictionaryFilter();
        });

        document.getElementById("loadMoreBtn").addEventListener("click", renderNextBatch);

        // Práctica
        document.querySelectorAll(".mode-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                state.practiceMode = btn.dataset.mode;
                initPractice();
            });
        });

        document.getElementById("practiceCategoryChips").addEventListener("click", e => {
            const chip = e.target.closest(".chip");
            if (!chip) return;
            document.querySelectorAll("#practiceCategoryChips .chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            state.practiceCategory = chip.dataset.cat;
            initPractice();
        });

        document.getElementById("nextQuizBtn").addEventListener("click", advanceQuiz);
        document.getElementById("restartQuizBtn").addEventListener("click", startQuizRound);

        const fcEl = document.getElementById("flashcardEl");
        fcEl.addEventListener("click", () => fcEl.classList.toggle("flipped"));
        fcEl.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fcEl.classList.toggle("flipped");
            }
        });
        document.getElementById("fcReviewBtn").addEventListener("click", () => nextFlashcard(true));
        document.getElementById("fcKnowBtn").addEventListener("click", () => nextFlashcard(false));

        document.getElementById("practiceFavsBtn").addEventListener("click", () => {
            state.practiceCategory = "favorites";
            document.querySelectorAll("#practiceCategoryChips .chip").forEach(c => {
                c.classList.toggle("active", c.dataset.cat === "favorites");
            });
            switchTab("practice");
            initPractice();
        });

        // Traductor
        document.getElementById("translateBtn").addEventListener("click", runTranslation);
        document.getElementById("swapDirBtn").addEventListener("click", () => {
            state.transDir = state.transDir === "es-ku" ? "ku-es" : "es-ku";
            updateTranslatorLabels();
            if (document.getElementById("translateInput").value.trim()) {
                runTranslation();
            }
        });
        document.getElementById("exampleBtn").addEventListener("click", () => {
            state.transDir = "es-ku";
            updateTranslatorLabels();
            document.getElementById("translateInput").value = "Mi nombre es Gonzalo y tengo un zorro en mi rancho";
            runTranslation();
        });
        document.getElementById("clearTransBtn").addEventListener("click", () => {
            document.getElementById("translateInput").value = "";
            document.getElementById("translateOutput").innerHTML = '<span class="muted">La traducción aparecerá aquí...</span>';
            state.lastTranslationPlain = "";
        });
        document.getElementById("copyTransBtn").addEventListener("click", async () => {
            if (!state.lastTranslationPlain) return;
            try {
                await navigator.clipboard.writeText(state.lastTranslationPlain);
                const fb = document.getElementById("copyFeedback");
                fb.textContent = "✓ Copiado";
                setTimeout(() => (fb.textContent = ""), 2000);
            } catch {
                document.getElementById("copyFeedback").textContent = "No se pudo copiar";
            }
        });

        // Globo flotante de Feedback
        const fab = document.getElementById("feedbackFab");
        const widget = document.getElementById("feedbackWidget");
        const closeBtn = document.getElementById("closeFeedbackBtn");
        const fbInput = document.getElementById("fbInput");

        fab.addEventListener("click", () => {
            const isHidden = widget.hidden;
            widget.hidden = !isHidden;
            if (!widget.hidden) {
                renderFeedbackMessages();
                fbInput.focus();
            }
        });

        closeBtn.addEventListener("click", () => {
            widget.hidden = true;
        });

        document.getElementById("fbTypeBar").addEventListener("click", e => {
            const btn = e.target.closest(".fb-type-chip");
            if (!btn) return;
            document.querySelectorAll(".fb-type-chip").forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            state.fbType = btn.dataset.type;
        });

        document.getElementById("fbForm").addEventListener("submit", e => {
            e.preventDefault();
            const text = fbInput.value.trim();
            if (!text) return;

            state.fbHistory.push({ type: state.fbType, text });
            if (state.fbHistory.length > 20) state.fbHistory.shift();
            localStorage.setItem("kunza_feedback_history", JSON.stringify(state.fbHistory));

            fbInput.value = "";
            renderFeedbackMessages();
        });
    }

    // Arranque
    document.addEventListener("DOMContentLoaded", () => {
        initLexicon();
        loadStorage();
        bindEvents();
        renderWordOfDay();
        applyDictionaryFilter();
        updateTranslatorLabels();
    });
})();
