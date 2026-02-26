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
        const password = document.getElementById('loginPassword').value;

        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('cinematch-users') || '[]');

        // Find user
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            const authData = {
                name: user.name,
                email: user.email,
                isLoggedIn: true
            };
            localStorage.setItem('cinematch-auth', JSON.stringify(authData));
            window.location.href = 'index.html';
        } else {
            alert('Invalid email or password. Please try again or sign up.');
        }
    });

    // Handle Signup
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        // Get existing users
        const users = JSON.parse(localStorage.getItem('cinematch-users') || '[]');

        // Check if user already exists
        if (users.some(u => u.email === email)) {
            alert('This email is already registered. Please login.');
            return;
        }

        // Add new user
        const newUser = { name, email, password };
        users.push(newUser);
        localStorage.setItem('cinematch-users', JSON.stringify(users));

        // Auto login after signup
        const authData = { name, email, isLoggedIn: true };
        localStorage.setItem('cinematch-auth', JSON.stringify(authData));
        window.location.href = 'index.html';
    });
});
