document.addEventListener('DOMContentLoaded', () => {
    // Reveal effect for elements
    const elements = document.querySelectorAll('.bio-card, .focus-card, .nav-button');
    
    elements.forEach((el, index) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = `all 0.6s ease-out ${index * 0.1}s`;
        
        setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
        }, 100);
    });
});
