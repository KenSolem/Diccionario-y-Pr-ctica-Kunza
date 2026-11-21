/* =========================================================
   Juegos Kunza — Módulo Independiente (games.js)
   Incluye: Memorice (con categorías), Sopa de Letras y Wordle
   ========================================================= */

(() => {
    // Set curado para la versión Demo (listo para agregar rutas en "img")
    const DEMO_WORDS = [
        // Colores
        { kunza: "Puri", esp: "Agua", cat: "cosmovision", emoji: "💧", img: "" },
        { kunza: "Ckamur", esp: "Sol", cat: "cosmovision", emoji: "☀️", img: "" },
        { kunza: "Ckamur", esp: "Luna", cat: "cosmovision", emoji: "🌙", img: "" },
        { kunza: "Pata", esp: "Tierra", cat: "cosmovision", emoji: "🌍", img: "" },
        { kunza: "Haari", esp: "Viento", cat: "cosmovision", emoji: "💨", img: "" },
        { kunza: "Haiti", esp: "Estrella", cat: "cosmovision", emoji: "⭐", img: "" },
        { kunza: "Lickan", esp: "Pueblo", cat: "cosmovision", emoji: "🏜️", img: "" },

        // Colores
        { kunza: "Chara", esp: "Rojo", cat: "colores", color: "#C0392B", emoji: "🔴", img: "" },
        { kunza: "Tchuri", esp: "Blanco", cat: "colores", color: "#F8F9FA", emoji: "⚪", img: "" },
        { kunza: "Lari", esp: "Amarillo", cat: "colores", color: "#F1C40F", emoji: "🟡", img: "" },
        { kunza: "Tchali", esp: "Negro", cat: "colores", color: "#222222", emoji: "⚫", img: "" },
        { kunza: "Ckari", esp: "Verde", cat: "colores", color: "#27AE60", emoji: "🟢", img: "" },
        { kunza: "Tchari", esp: "Azul", cat: "colores", color: "#2980B9", emoji: "🔵", img: "" },

        // Animales
        { kunza: "Aitzir", esp: "Vizcacha", cat: "animales", emoji: "🐰", img: "" },
        { kunza: "Suri", esp: "Ñandú", cat: "animales", emoji: "🦤", img: "" },
        { kunza: "Lari", esp: "Zorro", cat: "animales", emoji: "🦊", img: "" },
        { kunza: "Kuntur", esp: "Cóndor", cat: "animales", emoji: "🦅", img: "" },
        { kunza: "Mitchi", esp: "Gato", cat: "animales", emoji: "🐈", img: "" },
        { kunza: "Puma", esp: "Puma", cat: "animales", emoji: "🐆", img: "" },
        { kunza: "Lickau", esp: "Llama", cat: "animales", emoji: "🦙", img: "" },

        // Cuerpo
        { kunza: "Ckepi", esp: "Ojo", cat: "cuerpo", emoji: "👁️", img: "" },
        { kunza: "Hali", esp: "Cabeza", cat: "cuerpo", emoji: "🗣️", img: "" },
        { kunza: "Suna", esp: "Mano", cat: "cuerpo", emoji: "🖐️", img: "" },
        { kunza: "Ckasa", esp: "Pie", cat: "cuerpo", emoji: "🦶", img: "" },
        { kunza: "Tchuna", esp: "Corazón", cat: "cuerpo", emoji: "❤️", img: "" },
        { kunza: "Haya", esp: "Boca", cat: "cuerpo", emoji: "👄", img: "" }
    ];

    // Palabras Kunza de exactamente 5 letras (sin apóstrofes) para Wordle
    const WORDLE_WORDS = [
        { word: "HAARI", esp: "Viento", cat: "Cosmovisión" },
        { word: "HAITI", esp: "Estrella", cat: "Cosmovisión" },
        { word: "CHARA", esp: "Rojo", cat: "Colores" },
        { word: "CKARI", esp: "Verde", cat: "Colores" },
        { word: "CKEPI", esp: "Ojo", cat: "Cuerpo" },
        { word: "CKASA", esp: "Pie", cat: "Cuerpo" },
        { word: "CKAMU", esp: "Sol / Luz", cat: "Cosmovisión" },
        { word: "TCHAR", esp: "Azul", cat: "Colores" },
        { word: "PURIS", esp: "Aguas", cat: "Cosmovisión" },
        { word: "PATAS", esp: "Tierras", cat: "Cosmovisión" }
    ];

    function shuffle(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function cleanLetters(str) {
        return str
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^A-Z]/g, "");
    }

    /* =====================================================
       JUEGO 1: MEMORICE DE CARTAS
       ===================================================== */
    const memState = {
        cat: "all",
        pairs: 6,
        cards: [],
        flipped: [],
        matchedCount: 0,
        moves: 0,
        locked: false
    };

    function initMemoryGame() {
        const pool = memState.cat === "all"
            ? DEMO_WORDS
            : DEMO_WORDS.filter(w => w.cat === memState.cat);

        // Deduplicar por kunza para evitar parejas confusas
        const unique = [];
        const seen = new Set();
        shuffle(pool).forEach(w => {
            if (!seen.has(w.kunza)) {
                seen.add(w.kunza);
                unique.push(w);
            }
        });

        const selected = unique.slice(0, Math.min(memState.pairs, unique.length));
        memState.matchedCount = 0;
        memState.moves = 0;
        memState.flipped = [];
        memState.locked = false;

        document.getElementById("memMoves").textContent = "0";
        document.getElementById("memMatches").textContent = "0";
        document.getElementById("memTotal").textContent = String(selected.length);
        document.getElementById("memWinBanner").hidden = true;

        const deck = [];
        selected.forEach((item, idx) => {
            deck.push({ pairId: idx, side: "kunza", item });
            deck.push({ pairId: idx, side: "esp", item });
        });
        memState.cards = shuffle(deck);

        const board = document.getElementById("memBoard");
        board.innerHTML = "";

        memState.cards.forEach((cardData, index) => {
            const cardEl = document.createElement("div");
            cardEl.className = "mem-card";
            cardEl.dataset.index = String(index);

            let frontContent = "";
            if (cardData.side === "kunza") {
                frontContent = `
                    <div class="mem-word-kunza">${cardData.item.kunza}</div>
                    <span class="mem-type-badge">Kunza</span>
                `;
            } else {
                const visual = cardData.item.img
                    ? `<img src="${cardData.item.img}" alt="${cardData.item.esp}" style="width:42px;height:42px;object-fit:contain;margin-bottom:4px;">`
                    : cardData.item.color
                    ? `<div class="mem-color-dot" style="background:${cardData.item.color};"></div>`
                    : `<div class="mem-visual">${cardData.item.emoji || "🌵"}</div>`;

                frontContent = `
                    ${visual}
                    <div class="mem-word-esp">${cardData.item.esp}</div>
                    <span class="mem-type-badge">Español</span>
                `;
            }

            cardEl.innerHTML = `
                <div class="mem-card-inner">
                    <div class="mem-face mem-back">🌵</div>
                    <div class="mem-face mem-front">${frontContent}</div>
                </div>
            `;

            cardEl.addEventListener("click", () => handleMemFlip(cardEl, cardData));
            board.appendChild(cardEl);
        });
    }

    function handleMemFlip(cardEl, cardData) {
        if (memState.locked) return;
        if (cardEl.classList.contains("flipped") || cardEl.classList.contains("matched")) return;

        cardEl.classList.add("flipped");
        memState.flipped.push({ el: cardEl, data: cardData });

        if (memState.flipped.length === 2) {
            memState.moves++;
            document.getElementById("memMoves").textContent = String(memState.moves);
            memState.locked = true;

            const [first, second] = memState.flipped;
            if (first.data.pairId === second.data.pairId) {
                setTimeout(() => {
                    first.el.classList.add("matched");
                    second.el.classList.add("matched");
                    memState.matchedCount++;
                    document.getElementById("memMatches").textContent = String(memState.matchedCount);
                    memState.flipped = [];
                    memState.locked = false;

                    const total = parseInt(document.getElementById("memTotal").textContent, 10);
                    if (memState.matchedCount === total) {
                        document.getElementById("memWinText").textContent =
                            `Completaste las ${total} parejas en ${memState.moves} movimientos.`;
                        document.getElementById("memWinBanner").hidden = false;
                    }
                }, 320);
            } else {
                setTimeout(() => {
                    first.el.classList.remove("flipped");
                    second.el.classList.remove("flipped");
                    memState.flipped = [];
                    memState.locked = false;
                }, 780);
            }
        }
    }

    /* =====================================================
       JUEGO 2: SOPA DE LETRAS (10x10)
       ===================================================== */
    const WS_SIZE = 10;
    const wsState = {
        grid: [],
        placed: [],
        foundWords: new Set(),
        selecting: false,
        startCell: null,
        selectedCells: []
    };

    function initWordSearch() {
        wsState.grid = Array.from({ length: WS_SIZE }, () => Array(WS_SIZE).fill(""));
        wsState.placed = [];
        wsState.foundWords = new Set();
        wsState.selecting = false;
        wsState.startCell = null;
        wsState.selectedCells = [];
        document.getElementById("wsWinBanner").hidden = true;

        const candidates = shuffle(DEMO_WORDS).filter(w => {
            const c = cleanLetters(w.kunza);
            return c.length >= 4 && c.length <= 8;
        });

        const unique = [];
        const seen = new Set();
        candidates.forEach(w => {
            const c = cleanLetters(w.kunza);
            if (!seen.has(c)) {
                seen.add(c);
                unique.push({ ...w, clean: c });
            }
        });

        const dirs = [
            [0, 1],  // horizontal
            [1, 0],  // vertical
            [1, 1]   // diagonal
        ];

        for (const item of unique) {
            if (wsState.placed.length >= 6) break;
            let placedOk = false;

            for (let attempt = 0; attempt < 50 && !placedOk; attempt++) {
                const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
                const r0 = Math.floor(Math.random() * WS_SIZE);
                const c0 = Math.floor(Math.random() * WS_SIZE);
                const rEnd = r0 + dr * (item.clean.length - 1);
                const cEnd = c0 + dc * (item.clean.length - 1);

                if (rEnd < 0 || rEnd >= WS_SIZE || cEnd < 0 || cEnd >= WS_SIZE) continue;

                let canPlace = true;
                for (let i = 0; i < item.clean.length; i++) {
                    const ch = wsState.grid[r0 + dr * i][c0 + dc * i];
                    if (ch !== "" && ch !== item.clean[i]) {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    const coords = [];
                    for (let i = 0; i < item.clean.length; i++) {
                        const rr = r0 + dr * i;
                        const cc = c0 + dc * i;
                        wsState.grid[rr][cc] = item.clean[i];
                        coords.push(`${rr},${cc}`);
                    }
                    wsState.placed.push({ ...item, coords });
                    placedOk = true;
                }
            }
        }

        // Rellenar vacíos con letras aleatorias
        const alphabet = "AEIOUCLKPTHRSNM";
        for (let r = 0; r < WS_SIZE; r++) {
            for (let c = 0; c < WS_SIZE; c++) {
                if (!wsState.grid[r][c]) {
                    wsState.grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
                }
            }
        }

        renderWordSearch();
    }

    function renderWordSearch() {
        const gridEl = document.getElementById("wsGrid");
        gridEl.innerHTML = "";

        for (let r = 0; r < WS_SIZE; r++) {
            for (let c = 0; c < WS_SIZE; c++) {
                const cell = document.createElement("div");
                cell.className = "ws-cell";
                cell.textContent = wsState.grid[r][c];
                cell.dataset.r = String(r);
                cell.dataset.c = String(c);

                cell.addEventListener("pointerdown", e => {
                    e.preventDefault();
                    wsState.selecting = true;
                    wsState.startCell = { r, c };
                    updateWsSelection(r, c);
                });

                cell.addEventListener("pointerenter", () => {
                    if (wsState.selecting) updateWsSelection(r, c);
                });

                gridEl.appendChild(cell);
            }
        }

        const clueList = document.getElementById("wsClueList");
        clueList.innerHTML = "";
        wsState.placed.forEach(item => {
            const li = document.createElement("li");
            li.className = "ws-clue-item";
            li.dataset.word = item.clean;
            li.innerHTML = `<span>${item.emoji || "🔎"} ${item.esp}</span><small>${item.clean.length} letras</small>`;
            clueList.appendChild(li);
        });

        document.getElementById("wsFoundCount").textContent = "0";
        document.getElementById("wsTotalCount").textContent = String(wsState.placed.length);
    }

    function updateWsSelection(r1, c1) {
        document.querySelectorAll("#wsGrid .ws-cell.selecting").forEach(el => el.classList.remove("selecting"));
        wsState.selectedCells = [];

        const { r: r0, c: c0 } = wsState.startCell;
        const dr = r1 - r0;
        const dc = c1 - c0;

        const isHoriz = dr === 0;
        const isVert = dc === 0;
        const isDiag = Math.abs(dr) === Math.abs(dc);
        if (!isHoriz && !isVert && !isDiag) return;

        const steps = Math.max(Math.abs(dr), Math.abs(dc));
        const stepR = steps === 0 ? 0 : dr / steps;
        const stepC = steps === 0 ? 0 : dc / steps;

        for (let i = 0; i <= steps; i++) {
            const rr = r0 + stepR * i;
            const cc = c0 + stepC * i;
            const cell = document.querySelector(`#wsGrid .ws-cell[data-r="${rr}"][data-c="${cc}"]`);
            if (cell) {
                cell.classList.add("selecting");
                wsState.selectedCells.push({ r: rr, c: cc, ch: wsState.grid[rr][cc], el: cell });
            }
        }
    }

    function finalizeWsSelection() {
        if (!wsState.selecting) return;
        wsState.selecting = false;

        const wordFwd = wsState.selectedCells.map(x => x.ch).join("");
        const wordRev = wordFwd.split("").reverse().join("");

        const match = wsState.placed.find(
            p => !wsState.foundWords.has(p.clean) && (p.clean === wordFwd || p.clean === wordRev)
        );

        if (match) {
            wsState.foundWords.add(match.clean);
            wsState.selectedCells.forEach(x => {
                x.el.classList.remove("selecting", "hinted");
                x.el.classList.add("found");
            });

            const li = document.querySelector(`#wsClueList .ws-clue-item[data-word="${match.clean}"]`);
            if (li) {
                li.classList.add("found");
                li.innerHTML = `<span>✓ ${match.esp}</span><strong>${match.kunza}</strong>`;
            }

            document.getElementById("wsFoundCount").textContent = String(wsState.foundWords.size);
            if (wsState.foundWords.size === wsState.placed.length) {
                document.getElementById("wsWinBanner").hidden = false;
            }
        } else {
            wsState.selectedCells.forEach(x => x.el.classList.remove("selecting"));
        }

        wsState.selectedCells = [];
    }

    /* =====================================================
       JUEGO 3: WORDLE KUNZA (5 LETRAS)
       ===================================================== */
    const wdState = {
        target: null,
        row: 0,
        col: 0,
        guesses: [],
        over: false
    };

    const KB_ROWS = [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
        ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
    ];

    function initWordle() {
        wdState.target = WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)];
        wdState.row = 0;
        wdState.col = 0;
        wdState.guesses = Array.from({ length: 6 }, () => Array(5).fill(""));
        wdState.over = false;

        document.getElementById("wdCatTag").textContent = `🏷️ ${wdState.target.cat}`;
        const hintEl = document.getElementById("wdHintText");
        hintEl.hidden = true;
        hintEl.textContent = `Pista en español: "${wdState.target.esp}"`;
        document.getElementById("wdStatus").textContent = "";

        const board = document.getElementById("wdBoard");
        board.innerHTML = "";
        for (let r = 0; r < 6; r++) {
            const rowEl = document.createElement("div");
            rowEl.className = "wd-row";
            for (let c = 0; c < 5; c++) {
                const tile = document.createElement("div");
                tile.className = "wd-tile";
                tile.id = `wd-tile-${r}-${c}`;
                rowEl.appendChild(tile);
            }
            board.appendChild(rowEl);
        }

        const kb = document.getElementById("wdKeyboard");
        kb.innerHTML = "";
        KB_ROWS.forEach(rowKeys => {
            const rDiv = document.createElement("div");
            rDiv.className = "wd-kb-row";
            rowKeys.forEach(k => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "wd-key" + (k.length > 1 ? " wide" : "");
                btn.textContent = k;
                btn.dataset.key = k;
                btn.addEventListener("click", () => handleWordleKey(k));
                rDiv.appendChild(btn);
            });
            kb.appendChild(rDiv);
        });
    }

    function handleWordleKey(key) {
        if (wdState.over) return;

        if (key === "⌫" || key === "BACKSPACE") {
            if (wdState.col > 0) {
                wdState.col--;
                wdState.guesses[wdState.row][wdState.col] = "";
                const tile = document.getElementById(`wd-tile-${wdState.row}-${wdState.col}`);
                tile.textContent = "";
                tile.classList.remove("filled");
            }
            return;
        }

        if (key === "ENTER") {
            if (wdState.col < 5) {
                document.getElementById("wdStatus").textContent = "Completa las 5 letras primero.";
                return;
            }
            submitWordleRow();
            return;
        }

        if (/^[A-Z]$/.test(key) && wdState.col < 5) {
            wdState.guesses[wdState.row][wdState.col] = key;
            const tile = document.getElementById(`wd-tile-${wdState.row}-${wdState.col}`);
            tile.textContent = key;
            tile.classList.add("filled");
            wdState.col++;
            document.getElementById("wdStatus").textContent = "";
        }
    }

    function submitWordleRow() {
        const guess = wdState.guesses[wdState.row].join("");
        const target = wdState.target.word;
        const result = Array(5).fill("absent");
        const targetArr = target.split("");

        for (let i = 0; i < 5; i++) {
            if (guess[i] === targetArr[i]) {
                result[i] = "correct";
                targetArr[i] = null;
            }
        }

        for (let i = 0; i < 5; i++) {
            if (result[i] === "correct") continue;
            const idx = targetArr.indexOf(guess[i]);
            if (idx !== -1) {
                result[i] = "present";
                targetArr[idx] = null;
            }
        }

        for (let i = 0; i < 5; i++) {
            const tile = document.getElementById(`wd-tile-${wdState.row}-${i}`);
            tile.classList.add(result[i]);

            const keyBtn = document.querySelector(`#wdKeyboard .wd-key[data-key="${guess[i]}"]`);
            if (keyBtn) {
                if (result[i] === "correct") {
                    keyBtn.classList.remove("present", "absent");
                    keyBtn.classList.add("correct");
                } else if (result[i] === "present" && !keyBtn.classList.contains("correct")) {
                    keyBtn.classList.remove("absent");
                    keyBtn.classList.add("present");
                } else if (!keyBtn.classList.contains("correct") && !keyBtn.classList.contains("present")) {
                    keyBtn.classList.add("absent");
                }
            }
        }

        const status = document.getElementById("wdStatus");
        if (guess === target) {
            wdState.over = true;
            status.style.color = "var(--secondary)";
            status.textContent = `🎉 ¡Exacto! "${target}" significa "${wdState.target.esp}".`;
        } else if (wdState.row === 5) {
            wdState.over = true;
            status.style.color = "var(--danger)";
            status.textContent = `La palabra era "${target}" (${wdState.target.esp}).`;
        } else {
            wdState.row++;
            wdState.col = 0;
        }
    }

    /* =====================================================
       INICIALIZACIÓN Y EVENTOS DEL MÓDULO DE JUEGOS
       ===================================================== */
    document.addEventListener("DOMContentLoaded", () => {
        // Selector de sub-juegos
        document.getElementById("gameSelector").addEventListener("click", e => {
            const btn = e.target.closest(".game-tab-btn");
            if (!btn) return;
            document.querySelectorAll(".game-tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const targetGame = btn.dataset.game;
            document.querySelectorAll(".game-panel").forEach(p => {
                p.hidden = p.id !== `game-${targetGame}`;
            });
        });

        // Controles Memorice
        document.getElementById("memCategoryChips").addEventListener("click", e => {
            const chip = e.target.closest(".chip");
            if (!chip) return;
            document.querySelectorAll("#memCategoryChips .chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            memState.cat = chip.dataset.cat;
            initMemoryGame();
        });

        document.getElementById("memSizeSelect").addEventListener("change", e => {
            memState.pairs = parseInt(e.target.value, 10) || 6;
            initMemoryGame();
        });

        document.getElementById("memRestartBtn").addEventListener("click", initMemoryGame);
        document.getElementById("memPlayAgainBtn").addEventListener("click", initMemoryGame);

        // Controles Sopa de Letras
        window.addEventListener("pointerup", finalizeWsSelection);
        document.getElementById("wsRestartBtn").addEventListener("click", initWordSearch);
        document.getElementById("wsPlayAgainBtn").addEventListener("click", initWordSearch);
        document.getElementById("wsHintBtn").addEventListener("click", () => {
            const remaining = wsState.placed.find(p => !wsState.foundWords.has(p.clean));
            if (!remaining) return;
            const [r, c] = remaining.coords[0].split(",");
            const cell = document.querySelector(`#wsGrid .ws-cell[data-r="${r}"][data-c="${c}"]`);
            if (cell) cell.classList.add("hinted");
        });

        // Controles Wordle
        document.getElementById("wdRestartBtn").addEventListener("click", initWordle);
        document.getElementById("wdHintBtn").addEventListener("click", () => {
            document.getElementById("wdHintText").hidden = false;
        });

        // Teclado físico para Wordle solo cuando la pestaña Juegos + Wordle están activos
        window.addEventListener("keydown", e => {
            const gamesTab = document.getElementById("tab-games");
            const wordlePanel = document.getElementById("game-wordle");
            if (!gamesTab.classList.contains("active") || wordlePanel.hidden) return;
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

            if (e.key === "Enter") handleWordleKey("ENTER");
            else if (e.key === "Backspace") handleWordleKey("BACKSPACE");
            else if (/^[a-zA-Z]$/.test(e.key)) handleWordleKey(e.key.toUpperCase());
        });

        // Arranque inicial de los 3 juegos
        initMemoryGame();
        initWordSearch();
        initWordle();
    });
})();
