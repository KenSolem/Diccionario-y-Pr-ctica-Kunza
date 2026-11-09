// --- Reemplaza esta función en tu app.js ---

function renderVocabulary(data) {
    const grid = document.getElementById('vocabGrid');
    grid.innerHTML = '';
    
    if(data.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-secondary);">No se encontraron resultados.</p>';
        return;
    }

    // Limitamos la vista inicial a 100 elementos para evitar que el navegador se congele
    const displayData = data.slice(0, 100);

    displayData.forEach(item => {
        grid.innerHTML += `
            <div class="vocab-item">
                <h3>${item.kunza}</h3>
                <p><strong>Español:</strong> ${item.esp}</p>
                <p style="font-size: 0.8rem; text-transform: uppercase; color: var(--accent-color); margin-top: 0.25rem;">[${item.cat}]</p>
            </div>
        `;
    });

    // Si hay más de 100 resultados, mostramos un aviso amigable
    if (data.length > 100) {
        grid.innerHTML += `
            <div style="grid-column: 1 / -1; text-align: center; padding: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                Mostrando 100 de ${data.length} resultados. Escribe en el buscador para filtrar el resto.
            </div>
        `;
    }
}
