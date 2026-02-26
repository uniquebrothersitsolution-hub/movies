(function () {
    "use strict";

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    let allMovies = [];
    let sourceMovie = null;

    async function init() {
        // 1. Get Movie ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = parseInt(urlParams.get('movie'));

        if (!movieId) {
            window.location.href = 'index.html';
            return;
        }

        // 2. Load Data
        try {
            const res = await fetch("movies.json");
            allMovies = await res.json();
            sourceMovie = allMovies.find(m => m.id === movieId);

            if (!sourceMovie) {
                window.location.href = 'index.html';
                return;
            }

            renderSourceMovie();
            getAndRenderRecommendations();
            initTheme();
            displayUserInfo();
            setupRecommendationsListeners();
        } catch (err) {
            console.error(err);
        }
    }

    // ===== THEME TOGGLE =====
    function initTheme() {
        const saved = localStorage.getItem("cinematch-theme");
        if (saved === "light") {
            document.documentElement.setAttribute("data-theme", "light");
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute("data-theme");
        if (current === "light") {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("cinematch-theme", "dark");
        } else {
            document.documentElement.setAttribute("data-theme", "light");
            localStorage.setItem("cinematch-theme", "light");
        }
    }

    // ===== USER INFO =====
    function displayUserInfo() {
        const authData = JSON.parse(localStorage.getItem("cinematch-auth"));
        const navProfile = $("#navProfile");
        const navUserName = $("#navUserName");
        const userAvatar = $("#userAvatar");

        if (authData && navProfile) {
            navProfile.classList.remove("hidden");
            navUserName.textContent = authData.name;
            userAvatar.textContent = authData.name.charAt(0).toUpperCase();
        }
    }

    function setupRecommendationsListeners() {
        const themeToggle = $("#themeToggle");
        if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

        const mobileMenuBtn = $("#mobileMenuBtn");
        const mobileMenu = $("#mobileMenu");
        const mobileMenuBackdrop = $("#mobileMenuBackdrop");
        const mobileCloseBtn = $("#mobileCloseBtn");

        const toggleMenu = (show) => {
            mobileMenuBtn.classList.toggle("active", show);
            mobileMenu.classList.toggle("active", show);
            mobileMenuBackdrop.classList.toggle("active", show);
            document.body.style.overflow = show ? "hidden" : "";
        };

        if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", () => toggleMenu(true));
        if (mobileCloseBtn) mobileCloseBtn.addEventListener("click", () => toggleMenu(false));
        if (mobileMenuBackdrop) mobileMenuBackdrop.addEventListener("click", () => toggleMenu(false));

        if (mobileMenu) {
            mobileMenu.querySelectorAll(".mobile-link").forEach(link => {
                link.addEventListener("click", () => toggleMenu(false));
            });
        }
    }

    function renderSourceMovie() {
        const container = $("#sourceMovieUI");
        container.innerHTML = `
            <div class="source-movie-display">
                <div class="source-movie-poster">
                    <img src="${sourceMovie.poster}" alt="${sourceMovie.title}" onerror="this.parentElement.innerHTML='<div class=poster-fallback>🎬</div>'">
                </div>
                <div class="source-movie-details">
                    <h1>${sourceMovie.title}</h1>
                    <div class="modal-meta" style="margin-bottom: 20px;">
                        <span class="rating-badge">★ ${sourceMovie.rating}</span>
                        <span>${sourceMovie.year}</span>
                        <span>•</span>
                        <span>${sourceMovie.language}</span>
                    </div>
                    <p class="modal-desc" style="max-width: 600px;">${sourceMovie.description}</p>
                    <div class="selected-tags" style="margin-top: 24px;">
                        ${sourceMovie.genres.map(g => `<span class="selected-tag">${g}</span>`).join('')}
                        <span class="selected-tag" style="background:rgba(34,211,238,0.1);color:var(--cyan);border-color:rgba(34,211,238,0.15)">${sourceMovie.language}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Similarity Algorithm (Re-implemented for standalone use)
    function calculateSimilarity(source, target) {
        if (source.id === target.id) return -1;
        let score = 0;
        let maxScore = 0;

        // Director (4)
        maxScore += 4;
        if (source.director === target.director) score += 4;

        // Genre (3 each)
        const sG = new Set(source.genres);
        const tG = new Set(target.genres);
        maxScore += Math.max(sG.size, tG.size) * 3;
        sG.forEach(g => { if (tG.has(g)) score += 3; });

        // Cast (2 each)
        const sC = new Set(source.cast);
        const tC = new Set(target.cast);
        maxScore += Math.max(sC.size, tC.size) * 2;
        sC.forEach(c => { if (tC.has(c)) score += 2; });

        // Language (1)
        maxScore += 1;
        if (source.language === target.language) score += 1;

        return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    }

    function getAndRenderRecommendations() {
        const scored = allMovies
            .map(movie => ({
                movie,
                score: calculateSimilarity(sourceMovie, movie)
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);

        const grid = $("#recommendationsGrid");
        grid.innerHTML = "";

        scored.forEach(({ movie, score }, index) => {
            const card = document.createElement("div");
            card.className = "movie-card"; // Reuse standard movie card styling
            card.style.animationDelay = `${index * 0.1}s`;

            card.innerHTML = `
                <div class="movie-card-poster">
                    <img src="${movie.poster}" alt="${movie.title}" onerror="this.parentElement.innerHTML='<div class=poster-fallback>🎬</div>'">
                    <div class="movie-card-overlay">
                        <div class="overlay-content">
                            <span class="match-percentage" style="font-size: 1.5rem; font-weight: 800; color: var(--accent-3)">${score}%</span>
                            <span style="font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: var(--text-secondary)">Similarity Match</span>
                        </div>
                    </div>
                </div>
                <div class="movie-card-info">
                    <div class="movie-card-title">${movie.title}</div>
                    <div class="movie-card-meta">
                        <span class="movie-card-rating">★ ${movie.rating}</span>
                        <span>${movie.year}</span>
                    </div>
                </div>
            `;

            card.addEventListener("click", () => {
                window.location.href = `recommendations.html?movie=${movie.id}`;
            });

            grid.appendChild(card);
        });

        $("#resultsCount").textContent = `${scored.length} Personalized Recommendations`;
    }

    document.addEventListener("DOMContentLoaded", init);
})();
