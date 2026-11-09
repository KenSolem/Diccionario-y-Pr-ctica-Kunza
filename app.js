let currentCategory = 'all';
let activeQuizData = null;

function switchTab(tabId) {
    document.querySelectorAll('.section-card').forEach(card => card.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    if(tabId === 'dict') renderVocabulary(vocabulary);
}

function renderVocabulary(data) {
    const grid = document.getElementById('vocabGrid');
    grid.innerHTML = '';
    if(data.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-secondary);">No se encontraron resultados.</p>';
        return;
    }
    data.forEach(item => {
        grid.innerHTML += `
            <div class="vocab-item">
                <h3>${item.kunza}</h3>
                <p><strong>Español:</strong> ${item.esp}</p>
                <p style="font-size: 0.8rem; text-transform: uppercase; color: var(--accent-color); margin-top: 0.25rem;">[${item.cat}]</p>
            </div>
        `;
    });
}

function filterVocabulary() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = vocabulary.filter(item => 
        (currentCategory === 'all' || item.cat === currentCategory) &&
        (item.kunza.toLowerCase().includes(query) || item.esp.toLowerCase().includes(query))
    );
    renderVocabulary(filtered);
}

function filterByCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.section-card#dict .filter-chip').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    filterVocabulary();
}

function startQuiz(cat) {
    const pool = cat === 'all' ? vocabulary : vocabulary.filter(i => i.cat === cat);
    if(pool.length < 4) {
        alert("No hay suficientes palabras en esta categoría para generar el ejercicio.");
        return;
    }
    generateQuizQuestion(pool);
}

function generateQuizQuestion(pool) {
    const correctItem = pool[Math.floor(Math.random() * pool.length)];
    let distractors = pool.filter(i => i.kunza !== correctItem.kunza);
    distractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    let options = [...distractors, correctItem].sort(() => 0.5 - Math.random());

    document.getElementById('quizQuestion').innerText = `¿Cuál es el significado en español de: "${correctItem.kunza}"?`;
    const optionsDiv = document.getElementById('quizOptions');
    optionsDiv.innerHTML = '';
    document.getElementById('quizFeedback').innerText = '';
    document.getElementById('nextQuizBtn').style.display = 'none';

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.style.width = '100%';
        btn.style.textAlign = 'left';
        btn.innerText = opt.esp;
        btn.onclick = () => {
            if(opt.kunza === correctItem.kunza) {
                btn.style.backgroundColor = '#d1fae5';
                btn.style.color = '#065f46';
                document.getElementById('quizFeedback').innerText = "¡Correcto! Muy bien.";
                document.getElementById('quizFeedback').style.color = "#059669";
            } else {
                btn.style.backgroundColor = '#fee2e2';
                btn.style.color = '#991b1b';
                document.getElementById('quizFeedback').innerText = `Incorrecto. La respuesta era: ${correctItem.esp}`;
                document.getElementById('quizFeedback').style.color = "#dc2626";
            }
            document.querySelectorAll('#quizOptions button').forEach(b => b.disabled = true);
            document.getElementById('nextQuizBtn').style.display = 'inline-block';
            activeQuizData = pool;
        };
        optionsDiv.appendChild(btn);
    });
}

function nextDynamicQuiz() {
    if(activeQuizData) generateQuizQuestion(activeQuizData);
}

function translateSentence() {
    const rawText = document.getElementById('translateInput').value.trim();
    const output = document.getElementById('translateOutput');
    
    if(!rawText) {
        output.innerText = "Por favor escribe una oración...";
        return;
    }

    const words = rawText.split(/\s+/);
    
    let translatedWords = words.map(word => {
        const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").toLowerCase();
        
        if (!cleanWord) return word;

        const match = vocabulary.find(item => item.esp.toLowerCase().includes(cleanWord) || item.kunza.toLowerCase().includes(cleanWord));
        
        if (match) {
            return `<span style="color: var(--accent-color); font-weight: 600;" title="Traducción: ${match.kunza} ⇄ ${match.esp}">${match.kunza}</span>`;
        } else {
            return `<span style="color: var(--text-primary); opacity: 0.8;" title="Mantenido en texto original">${word}</span>`;
        }
    });

    output.innerHTML = translatedWords.join(' ');
}

window.onload = function() {
    renderVocabulary(vocabulary);
};
