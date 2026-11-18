import { mountPhishingHunter } from "./challenges/phishingHunter.js";
import { startRouter, navigate } from "./router.js";
import { renderPage } from "./screens/pages.js";

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
                <button class="nav-item" data-route="overview">
                    <span>⌂</span> Overview
                </button>
                <button class="nav-item" data-route="academy">
                    <span>▤</span> Academy
                </button>
                <button class="nav-item" data-route="operations">
                    <span>◈</span> Operations
                </button>
                <button class="nav-item" data-route="ctf">
                    <span>⚑</span> CTF Arena
                </button>
            </nav>

            <div class="sidebar-bottom">
                <div class="connection">
                    <span class="status-dot"></span>
                    SYSTEM ONLINE
                </div>
                <p>CYBER BREACH v0.2.0</p>
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

            <section class="page-content" id="page-content"></section>
        </main>
    </div>

    <div class="toast" id="toast"></div>
`;

const pageContent = document.querySelector("#page-content");
const currentSection = document.querySelector("#current-section");
const toast = document.querySelector("#toast");
let cleanupMission = null;

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        toast.classList.remove("visible");
    }, 2500);
}

function render(route) {
    if (cleanupMission) {
    cleanupMission();
    cleanupMission = null;
}
    pageContent.innerHTML = renderPage(route);

    const labels = {
        overview: "OVERVIEW",
        academy: "ACADEMY",
        operations: "OPERATIONS",
        ctf: "CTF ARENA",
        tracks: "CYBER BASICS",
        mission: "MISSION BRIEFING"
    };

    currentSection.textContent = labels[route.page] || "COMMAND CENTER";

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.route === route.page
        );
    });

    window.scrollTo(0, 0);
}

app.addEventListener("click", event => {
    const routeButton = event.target.closest("[data-route]");

    if (routeButton) {
        navigate(routeButton.dataset.route);
        return;
    }

    const actionButton = event.target.closest("[data-action]");

    if (actionButton?.dataset.action === "start-mission") {
    const mode = actionButton.dataset.mode;
    cleanupMission = mountPhishingHunter(pageContent, mode);
}
});

startRouter(render);

console.log("CYBER BREACH SYSTEM INITIALIZED");
console.log("SCREEN ROUTER ONLINE");
