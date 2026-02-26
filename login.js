document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.auth-tab');
    const tabsContainer = document.querySelector('.auth-tabs');
    const forms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // If already logged in, redirect to index
    const authData = localStorage.getItem('cinematch-auth');
    if (authData) {
        window.location.href = 'index.html';
    }

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            // Update active tab styles
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabsContainer.dataset.active = target;

            // Show correct form
            forms.forEach(f => f.classList.remove('active'));
            document.getElementById(target + 'Form').classList.add('active');
        });
    });

    // Handle Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        // In a real app we'd verify password. Here we simulate success.

        const userData = {
            name: email.split('@')[0], // Generate a name from email
            email: email,
            isLoggedIn: true
        };

        localStorage.setItem('cinematch-auth', JSON.stringify(userData));
        window.location.href = 'index.html';
    });

    // Handle Signup
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;

        const userData = {
            name: name,
            email: email,
            isLoggedIn: true
        };

        localStorage.setItem('cinematch-auth', JSON.stringify(userData));
        window.location.href = 'index.html';
    });
});
