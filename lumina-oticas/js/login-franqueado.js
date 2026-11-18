document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    if (emailInput && !emailInput.value) emailInput.value = 'franqueado@luminaoticas.com.br';
    if (passInput && !passInput.value) passInput.value = 'lumina2026';
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            window.location.href = 'portal-franqueado.html';
        });
    }
});
