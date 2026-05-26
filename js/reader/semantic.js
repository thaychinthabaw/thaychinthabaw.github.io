export function buildSemanticParagraphs() {
    const containers = document.querySelectorAll('.raw-text');
    let globalIndex = 1;

    containers.forEach((container) => {

        // 🔥 IMPORTANT FIX: textContent
        const rawText = container.textContent.trim();

        const paragraphs = rawText
            .split(/\n\s*\n/)
            .filter(p => p.trim() !== '');

        container.innerHTML = '';

        paragraphs.forEach((text) => {

            const cleanText = text.trim();

            // ===== GAP SYSTEM =====
            if (cleanText === '@@gap') {
                const gap = document.createElement('div');
                gap.className = 'big-gap';
                container.appendChild(gap);
                return;
            }

            // ===== PARAGRAPH =====
            const p = document.createElement('p');
            p.setAttribute('data-p', globalIndex);
            p.textContent = cleanText;

            container.appendChild(p);
            globalIndex++;
        });
    });
}
