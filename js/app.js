
const app = document.querySelector("#app");

app.innerHTML = `
    <div class="game-shell">

        <aside class="sidebar">
            <div class="brand">
                <div class="brand-icon">CB</div>
                <div>
                    <h2>CYBER BREACH</h2>
                    <span>SECURITY OPERATIONS</span>
                </div>
            </div>

            <div class="nav-label">MAIN MENU</div>

            <nav class="navigation">
                <button class="nav-item active" data-screen="Overview">
                    <span>⌂</span> Overview
                </button>
                <button class="nav-item" data-screen="Academy">
                    <span>▤</span> Academy
                </button>
                <button class="nav-item" data-screen="Operations">
                    <span>◈</span> Operations
                </button>
                <button class="nav-item" data-screen="CTF Arena">
                    <span>⚑</span> CTF Arena
                </button>
                <button class="nav-item" data-screen="Leaderboard">
                    <span>♜</span> Leaderboard
                </button>
            </nav>

            <div class="sidebar-bottom">
                <div class="connection">
                    <span class="status-dot"></span>
                    SYSTEM ONLINE
                </div>
                <p>CYBER BREACH v0.1.0</p>
            </div>
        </aside>

        <main class="main-content">

            <header class="topbar">
                <div class="breadcrumb">
                    <span>COMMAND CENTER</span>
                    <span class="breadcrumb-divider">/</span>
                    <strong id="current-section">OVERVIEW</strong>
                </div>

                <div class="player-info">
                    <div class="player-avatar">P</div>
                    <div>
                        <strong>New Operative</strong>
                        <span>LEVEL 01</span>
                    </div>
                </div>
            </header>

            <section class="page-content" id="page-content">

                <div class="welcome-row">
                    <div>
                        <div class="eyebrow">
                            <span class="status-dot"></span>
                            OPERATIVE TERMINAL
                        </div>
                        <h1>Welcome back, <span>Operative.</span></h1>
                        <p class="welcome-description">
                            Your mission begins here. Learn, investigate,
                            and prove your cybersecurity skills.
                        </p>
                    </div>

                    <div class="date-card">
                        <span>YOUR STATUS</span>
                        <strong>READY</strong>
                        <small>Awaiting deployment</small>
                    </div>
                </div>

                <div class="section-heading">
                    <div>
                        <span class="eyebrow">YOUR TRAINING</span>
                        <h2>Choose your operation</h2>
                    </div>
                    <span class="section-count">03 GAME MODES</span>
                </div>

                <div class="mode-grid">

                    <article class="mode-card academy">
                        <div class="mode-top">
                            <span class="mode-icon">▤</span>
                            <span class="mode-tag">LEARN</span>
                        </div>
                        <h3>Academy</h3>
                        <p>
                            Learn cybersecurity through guided lessons,
                            examples, and beginner-friendly challenges.
                        </p>
                        <button class="mode-button" data-screen="Academy">
                            ENTER ACADEMY <span>→</span>
                        </button>
                    </article>

                    <article class="mode-card operations">
                        <div class="mode-top">
                            <span class="mode-icon">◈</span>
                            <span class="mode-tag">PRACTICE</span>
                        </div>
                        <h3>Operations</h3>
                        <p>
                            Investigate simulated incidents and test
                            your skills in practical scenarios.
                        </p>
                        <button class="mode-button" data-screen="Operations">
                            START OPERATIONS <span>→</span>
                        </button>
                    </article>

                    <article class="mode-card arena">
                        <div class="mode-top">
                            <span class="mode-icon">⚑</span>
                            <span class="mode-tag">COMPETE</span>
                        </div>
                        <h3>CTF Arena</h3>
                        <p>
                            Take on multi-stage challenges, find flags,
                            and prove your abilities.
                        </p>
                        <button class="mode-button" data-screen="CTF Arena">
                            ENTER ARENA <span>→</span>
                        </button>
                    </article>

                </div>

                <div class="lower-grid">

                    <section class="mission-panel">
                        <div class="panel-heading">
                            <div>
                                <span class="eyebrow">FEATURED MISSION</span>
                                <h2>Phishing Hunter</h2>
                            </div>
                            <span class="difficulty">BEGINNER</span>
                        </div>

                        <div class="mission-body">
                            <div class="mission-symbol">✉</div>
                            <div class="mission-description">
                                <h3>Can you spot a malicious email?</h3>
                                <p>
                                    Investigate suspicious emails, identify
                                    warning signs, and separate phishing
                                    attempts from legitimate messages.
                                </p>
                                <div class="mission-meta">
                                    <span>◈ Cyber Basics</span>
                                    <span>◷ 5–10 MIN</span>
                                    <span>✦ XP REWARD</span>
                                </div>
                            </div>
                        </div>

                        <button class="primary-button" data-screen="Phishing Hunter">
                            VIEW MISSION BRIEFING <span>→</span>
                        </button>
                    </section>

                    <section class="progress-panel">
                        <span class="eyebrow">OPERATIVE PROFILE</span>
                        <h2>Your progress</h2>

                        <div class="level-row">
                            <div class="level-badge">01</div>
                            <div>
                                <strong>Rookie</strong>
                                <p>Cybersecurity Trainee</p>
                            </div>
                        </div>

                        <div class="xp-label">
                            <span>EXPERIENCE POINTS</span>
                            <strong>0 / 100 XP</strong>
                        </div>

                        <div class="xp-track">
                            <div class="xp-fill"></div>
                        </div>

                        <p class="progress-note">
                            Complete missions to earn XP and level up.
                        </p>

                        <div class="profile-stats">
                            <div>
                                <strong>0</strong>
                                <span>MISSIONS</span>
                            </div>
                            <div>
                                <strong>0</strong>
                                <span>BADGES</span>
                            </div>
                            <div>
                                <strong>0</strong>
                                <span>STREAK</span>
                            </div>
                        </div>
                    </section>

                </div>

                <footer class="footer">
                    <span>CYBER BREACH © 2026</span>
                    <span>LEARN. INVESTIGATE. PROVE YOURSELF.</span>
                </footer>

            </section>
        </main>
    </div>

    <div class="toast" id="toast"></div>
`;

const pageContent = document.querySelector("#page-content");
const currentSection = document.querySelector("#current-section");
const toast = document.querySelector("#toast");

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");

    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.remove("visible");
    }, 2500);
}

function navigate(screen) {
    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.screen === screen
        );
    });

    currentSection.textContent = screen.toUpperCase();

    if (screen === "Overview") {
        location.reload();
        return;
    }

    if (screen === "Phishing Hunter") {
        showToast("Phishing Hunter briefing is coming in our next mission milestone.");
        return;
    }

    showToast(`${screen} module is planned for a future milestone.`);
}

document.querySelectorAll("[data-screen]").forEach(button => {
    button.addEventListener("click", () => {
        navigate(button.dataset.screen);
    });
});

console.log("CYBER BREACH SYSTEM INITIALIZED");
console.log("MAIN MENU LOADED");