/* =========================================
   CineMatch — Movie Recommendation Engine
   Content-Based Filtering Algorithm
   ========================================= */

(function () {
  "use strict";

  // ===== STATE =====
  let allMovies = [];
  let filteredMovies = [];
  let activeGenre = "All";
  let activeLanguage = "All";
  let activeSort = "rating";
  let searchQuery = "";

  // ===== DOM REFS =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const movieGrid = $("#movieGrid");
  const emptyState = $("#emptyState");
  const searchInput = $("#searchInput");
  const searchCount = $("#searchCount");
  const genreFilters = $("#genreFilters");
  const languageFilters = $("#languageFilters");
  const recSection = $("#recommendations");
  const exploreSection = $("#explore");
  const selectedMovieCard = $("#selectedMovieCard");
  const recResults = $("#recResults");
  const recSubtitle = $("#recSubtitle");
  const backToExploreBtn = $("#backToExplore");
  const movieModal = $("#movieModal");
  const modalContent = $("#modalContent");
  const navbar = $("#navbar");
  const mobileMenuBtn = $("#mobileMenuBtn");
  const mobileMenu = $("#mobileMenu");
  const heroParticles = $("#heroParticles");
  const themeToggle = $("#themeToggle");

  // Auth & Player Refs
  const navProfile = $("#navProfile");
  const navUserName = $("#navUserName");
  const userAvatar = $("#userAvatar");
  const logoutBtn = $("#logoutBtn");
  const playerOverlay = $("#playerOverlay");
  const playerTitle = $("#playerTitle");
  const playerMeta = $("#playerMeta");
  const playerPoster = $("#playerPoster");
  const progressBar = $("#progressBar");
  const doneWatchingBtn = $("#doneWatchingBtn");

  // Rec Prompt Refs
  const recPromptModal = $("#recPromptModal");
  const lastWatchedTitle = $("#lastWatchedTitle");
  const getRecsBtn = $("#getRecsBtn");
  const promptExploreBtn = $("#promptExploreBtn");

  // ===== INIT =====
  async function init() {
    if (!checkAuth()) return;
    initTheme();
    await loadMovies();
    buildFilters();
    applyFilters();
    setupEventListeners();
    createParticles();
    setupScrollEffects();
    displayUserInfo();
  }

  // ===== AUTHENTICATION =====
  function checkAuth() {
    const authData = localStorage.getItem("cinematch-auth");
    if (!authData) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  function displayUserInfo() {
    const authData = JSON.parse(localStorage.getItem("cinematch-auth"));
    if (authData && navProfile) {
      navProfile.classList.remove("hidden");
      navUserName.textContent = authData.name;
      userAvatar.textContent = authData.name.charAt(0).toUpperCase();
    }
  }

  function logout() {
    localStorage.removeItem("cinematch-auth");
    window.location.href = "login.html";
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

  // ===== LOAD MOVIES =====
  async function loadMovies() {
    try {
      const res = await fetch("movies.json");
      allMovies = await res.json();
    } catch (err) {
      console.error("Failed to load movies:", err);
      allMovies = [];
    }
  }

  // ===== BUILD FILTER CHIPS =====
  function buildFilters() {
    // Extract unique genres
    const genres = new Set();
    allMovies.forEach((m) => m.genres.forEach((g) => genres.add(g)));
    const sortedGenres = [...genres].sort();
    sortedGenres.forEach((genre) => {
      const btn = document.createElement("button");
      btn.className = "chip";
      btn.dataset.genre = genre;
      btn.textContent = genre;
      genreFilters.appendChild(btn);
    });

    // Extract unique languages
    const languages = new Set();
    allMovies.forEach((m) => languages.add(m.language));
    const langOrder = ["Tamil", "Hindi", "English", "Telugu", "Kannada"];
    const sortedLangs = langOrder.filter((l) => languages.has(l));
    // Add any remaining languages not in the predefined order
    languages.forEach((l) => {
      if (!sortedLangs.includes(l)) sortedLangs.push(l);
    });

    sortedLangs.forEach((lang) => {
      const btn = document.createElement("button");
      btn.className = "chip";
      btn.dataset.language = lang;
      btn.textContent = lang;
      languageFilters.appendChild(btn);
    });
  }

  // ===== APPLY FILTERS & RENDER =====
  function applyFilters() {
    filteredMovies = allMovies.filter((movie) => {
      // Genre filter
      if (activeGenre !== "All" && !movie.genres.includes(activeGenre))
        return false;

      // Language filter
      if (activeLanguage !== "All" && movie.language !== activeLanguage)
        return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = [
          movie.title,
          movie.director,
          ...movie.genres,
          movie.language,
          ...movie.cast,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      return true;
    });

    // Sort
    filteredMovies.sort((a, b) => {
      if (activeSort === "rating") return b.rating - a.rating;
      if (activeSort === "year") return b.year - a.year;
      if (activeSort === "title") return a.title.localeCompare(b.title);
      return 0;
    });

    renderMovieGrid();
  }

  // ===== RENDER MOVIE GRID =====
  function renderMovieGrid() {
    movieGrid.innerHTML = "";

    if (filteredMovies.length === 0) {
      emptyState.classList.remove("hidden");
      searchCount.textContent = "0 results";
      return;
    }

    emptyState.classList.add("hidden");
    searchCount.textContent = `${filteredMovies.length} movie${filteredMovies.length !== 1 ? "s" : ""}`;

    filteredMovies.forEach((movie, index) => {
      const card = document.createElement("div");
      card.className = "movie-card";
      card.style.animationDelay = `${index * 0.05}s`;
      card.dataset.id = movie.id;

      card.innerHTML = `
        <div class="movie-card-poster">
          <img src="${movie.poster}" alt="${movie.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=poster-fallback>🎬</div>'">
          <div class="movie-card-overlay">
            <div class="overlay-content">
              <span class="overlay-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4"/></svg>
                Get Recommendations
              </span>
            </div>
          </div>
        </div>
        <div class="movie-card-info">
          <div class="movie-card-title" title="${movie.title}">${movie.title}</div>
          <div class="movie-card-meta">
            <span class="movie-card-rating">★ ${movie.rating}</span>
            <span>${movie.year}</span>
            <span>•</span>
            <span>${movie.language}</span>
          </div>
          <div class="movie-card-tags">
            ${movie.genres
          .slice(0, 2)
          .map((g) => `<span class="movie-tag">${g}</span>`)
          .join("")}
            <span class="movie-tag movie-lang-tag">${movie.language}</span>
          </div>
        </div>
      `;

      card.addEventListener("click", () => showMovieModal(movie));
      movieGrid.appendChild(card);
    });
  }

  // ===== MOVIE MODAL =====
  function showMovieModal(movie) {
    modalContent.innerHTML = `
      <div class="modal-poster-container">
        <img src="${movie.poster}" alt="${movie.title}" onerror="this.parentElement.innerHTML='<div class=poster-fallback style=height:320px>🎬</div>'">
        <div class="modal-poster-gradient"></div>
        <button class="modal-close" id="modalCloseBtn">✕</button>
      </div>
      <div class="modal-body">
        <h2>${movie.title}</h2>
        <div class="modal-meta">
          <span class="rating-badge">★ ${movie.rating}</span>
          <span>${movie.year}</span>
          <span>•</span>
          <span>${movie.language}</span>
        </div>
        <p class="modal-desc">${movie.description}</p>
        <div class="modal-detail-row">
          <span class="modal-detail-label">Director</span>
          <span class="modal-detail-value">${movie.director}</span>
        </div>
        <div class="modal-detail-row">
          <span class="modal-detail-label">Cast</span>
          <span class="modal-detail-value">${movie.cast.join(", ")}</span>
        </div>
        <div class="modal-tags">
          ${movie.genres.map((g) => `<span class="selected-tag">${g}</span>`).join("")}
          <span class="selected-tag" style="background:rgba(34,211,238,0.1);color:var(--cyan);border-color:rgba(34,211,238,0.15)">${movie.language}</span>
        </div>
        <button class="btn btn-primary modal-rec-btn" id="modalWatchBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          <span>Watch Movie</span>
        </button>
      </div>
    `;

    movieModal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Close button
    $("#modalCloseBtn").addEventListener("click", closeModal);

    // Watch button
    $("#modalWatchBtn").addEventListener("click", () => {
      closeModal();
      startMovieWatch(movie);
    });
  }

  function closeModal() {
    movieModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  // ===== MOVIE WATCH FLOW =====
  function startMovieWatch(movie) {
    if (!playerOverlay) return;

    // Set player content
    playerTitle.textContent = movie.title;
    playerMeta.textContent = `${movie.year} • ${movie.genres.join(", ")} • ${movie.language}`;
    playerPoster.src = movie.poster;
    progressBar.style.width = "0%";

    // Show player
    playerOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // Animate progress bar (simulated)
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      progressBar.style.width = `${progress}%`;
    }, 100);

    // Done watching
    const handleDone = () => {
      clearInterval(interval);
      playerOverlay.classList.add("hidden");
      document.body.style.overflow = "";
      doneWatchingBtn.removeEventListener("click", handleDone);

      // Show recommendation prompt
      if (lastWatchedTitle) lastWatchedTitle.textContent = movie.title;
      if (recPromptModal) recPromptModal.classList.add("active");
    };

    doneWatchingBtn.addEventListener("click", handleDone);
  }

  // ===================================================
  //  CONTENT-BASED FILTERING — RECOMMENDATION ENGINE
  // ===================================================

  /**
   * Calculates similarity score between two movies
   * using weighted feature matching.
   *
   * Weights:
   *  - Director match:  4 points
   *  - Genre overlap:   3 points per shared genre
   *  - Cast overlap:    2 points per shared actor
   *  - Language match:   1 point
   *
   * Returns a normalized score from 0 to 100.
   */
  function calculateSimilarity(source, target) {
    if (source.id === target.id) return -1; // skip self

    let score = 0;
    let maxScore = 0;

    // 1) Director Match (weight: 4)
    maxScore += 4;
    if (source.director === target.director) {
      score += 4;
    }

    // 2) Genre Overlap (weight: 3 per genre)
    const sourceGenres = new Set(source.genres);
    const targetGenres = new Set(target.genres);
    const maxGenres = Math.max(sourceGenres.size, targetGenres.size);
    maxScore += maxGenres * 3;

    let genreOverlap = 0;
    sourceGenres.forEach((g) => {
      if (targetGenres.has(g)) genreOverlap++;
    });
    score += genreOverlap * 3;

    // 3) Cast Overlap (weight: 2 per actor)
    const sourceCast = new Set(source.cast);
    const targetCast = new Set(target.cast);
    const maxCast = Math.max(sourceCast.size, targetCast.size);
    maxScore += maxCast * 2;

    let castOverlap = 0;
    sourceCast.forEach((c) => {
      if (targetCast.has(c)) castOverlap++;
    });
    score += castOverlap * 2;

    // 4) Language Match (weight: 1)
    maxScore += 1;
    if (source.language === target.language) {
      score += 1;
    }

    // Normalize to percentage
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  function getRecommendations(sourceMovie) {
    // Score all movies
    const scored = allMovies
      .map((movie) => ({
        movie,
        score: calculateSimilarity(sourceMovie, movie),
      }))
      .filter((item) => item.score > 0) // Remove self & zero-score
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Top 8 recommendations

    // Show results
    renderRecommendations(sourceMovie, scored);
  }

  // ===== RENDER RECOMMENDATIONS =====
  function renderRecommendations(sourceMovie, results) {
    // Hide explore, show recs
    exploreSection.classList.add("hidden");
    recSection.classList.remove("hidden");

    // Scroll up
    recSection.scrollIntoView({ behavior: "smooth", block: "start" });

    // Update subtitle
    recSubtitle.textContent = `Here are movies similar to "${sourceMovie.title}" ranked by our content-based similarity algorithm.`;

    // Selected movie card
    selectedMovieCard.innerHTML = `
      <div class="selected-poster">
        <img src="${sourceMovie.poster}" alt="${sourceMovie.title}" onerror="this.parentElement.innerHTML='<div class=poster-fallback>🎬</div>'">
      </div>
      <div class="selected-details">
        <h3>${sourceMovie.title}</h3>
        <div class="selected-meta">
          <span class="rating-badge">★ ${sourceMovie.rating}</span>
          <span>${sourceMovie.year}</span>
          <span>•</span>
          <span>${sourceMovie.language}</span>
          <span>•</span>
          <span>Dir: ${sourceMovie.director}</span>
        </div>
        <p class="selected-desc">${sourceMovie.description}</p>
        <div class="selected-tags">
          ${sourceMovie.genres.map((g) => `<span class="selected-tag">${g}</span>`).join("")}
          <span class="selected-tag" style="background:rgba(34,211,238,0.1);color:var(--cyan);border-color:rgba(34,211,238,0.15)">${sourceMovie.language}</span>
        </div>
      </div>
    `;

    // Recommendation results
    recResults.innerHTML = "";

    if (results.length === 0) {
      recResults.innerHTML = `
        <div class="empty-state">
          <h3>No similar movies found</h3>
          <p>Try selecting a different movie to get recommendations.</p>
        </div>
      `;
      return;
    }

    results.forEach(({ movie, score }, index) => {
      const card = document.createElement("div");
      card.className = "rec-card";
      card.style.animationDelay = `${index * 0.1}s`;

      // Determine match factors
      const factors = [];
      if (movie.director === sourceMovie.director) factors.push("Same Director");
      const sharedGenres = movie.genres.filter((g) =>
        sourceMovie.genres.includes(g)
      );
      if (sharedGenres.length > 0) factors.push(sharedGenres.join(", "));
      const sharedCast = movie.cast.filter((c) =>
        sourceMovie.cast.includes(c)
      );
      if (sharedCast.length > 0)
        factors.push(`Shared Cast: ${sharedCast.join(", ")}`);
      if (movie.language === sourceMovie.language)
        factors.push(`Same Language`);

      card.innerHTML = `
        <div class="rec-rank">#${index + 1}</div>
        <div class="rec-poster">
          <img src="${movie.poster}" alt="${movie.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=poster-fallback style=font-size:1.5rem>🎬</div>'">
        </div>
        <div class="rec-info">
          <h4>${movie.title}</h4>
          <div class="rec-info-meta">
            <span style="color:#fbbf24;font-weight:600">★ ${movie.rating}</span>
            <span>${movie.year}</span>
            <span>•</span>
            <span>${movie.language}</span>
            <span>•</span>
            <span>${movie.director}</span>
          </div>
          <p>${movie.description}</p>
          <div class="rec-info-tags">
            ${movie.genres.map((g) => `<span class="movie-tag">${g}</span>`).join("")}
          </div>
        </div>
        <div class="rec-match-score">
          <div>
            <div class="match-percentage">${score}%</div>
            <div class="match-label">Match</div>
          </div>
          <div class="match-bar-container">
            <div class="match-bar" style="width: ${score}%"></div>
          </div>
        </div>
      `;

      card.addEventListener("click", () => showMovieModal(movie));
      recResults.appendChild(card);
    });

    // Update nav
    updateActiveNav("recommendations");
  }

  // ===== EVENT LISTENERS =====
  function setupEventListeners() {
    // Genre filter clicks
    genreFilters.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activeGenre = chip.dataset.genre;
      genreFilters
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      applyFilters();
    });

    // Language filter clicks
    languageFilters.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activeLanguage = chip.dataset.language;
      languageFilters
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      applyFilters();
    });

    // Sort filter clicks
    const sortFilters = $("#sortFilters");
    sortFilters.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activeSort = chip.dataset.sort;
      sortFilters
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      applyFilters();
    });

    // Search input
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value.trim();
        applyFilters();
      }, 250);
    });

    // Back to explore
    backToExploreBtn.addEventListener("click", () => {
      recSection.classList.add("hidden");
      exploreSection.classList.remove("hidden");
      exploreSection.scrollIntoView({ behavior: "smooth", block: "start" });
      updateActiveNav("explore");
    });

    // Modal overlay click (close)
    movieModal.addEventListener("click", (e) => {
      if (e.target === movieModal) closeModal();
    });

    // Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // Theme toggle
    themeToggle.addEventListener("click", toggleTheme);

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }

    // Mobile menu
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenuBtn.classList.toggle("active");
      mobileMenu.classList.toggle("active");
    });

    // Mobile links
    mobileMenu.querySelectorAll(".mobile-link").forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenuBtn.classList.remove("active");
        mobileMenu.classList.remove("active");
      });
    });

    // Rec Prompt Actions
    if (getRecsBtn) {
      getRecsBtn.onclick = () => {
        const title = lastWatchedTitle?.textContent;
        const movie = allMovies.find(m => m.title === title);
        if (movie) {
          window.location.href = `recommendations.html?movie=${movie.id}`;
        }
      };
    }

    if (promptExploreBtn) {
      promptExploreBtn.onclick = () => {
        recPromptModal.classList.remove("active");
        exploreSection.scrollIntoView({ behavior: "smooth" });
        updateActiveNav("explore");
      };
    }

    // Nav link clicks
    $$(".nav-link, .mobile-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        const section = link.dataset.section;
        if (section === "recommendations" && recSection.classList.contains("hidden")) {
          e.preventDefault();
          // scroll to explore instead
          exploreSection.scrollIntoView({ behavior: "smooth" });
        }
        if (section === "explore") {
          // Make sure explore is visible
          if (exploreSection.classList.contains("hidden")) {
            recSection.classList.add("hidden");
            exploreSection.classList.remove("hidden");
          }
        }
      });
    });
  }

  // ===== SCROLL EFFECTS =====
  function setupScrollEffects() {
    // Navbar background
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    });

    // Active nav link based on scroll
    const sections = ["hero", "how-it-works", "explore", "recommendations"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            updateActiveNav(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  function updateActiveNav(sectionId) {
    $$(".nav-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.section === sectionId);
    });
  }

  // ===== HERO PARTICLES =====
  function createParticles() {
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${60 + Math.random() * 40}%`;
      particle.style.animationDelay = `${Math.random() * 6}s`;
      particle.style.animationDuration = `${4 + Math.random() * 4}s`;
      heroParticles.appendChild(particle);
    }
  }

  // ===== START =====
  document.addEventListener("DOMContentLoaded", init);
})();
