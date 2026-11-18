
function overviewPage() {
    return `
        <div class="screen-heading">
            <span class="eyebrow">COMMAND CENTER</span>
            <h1>Welcome back, <span>Operative.</span></h1>
            <p>Select a training environment and begin your cybersecurity journey.</p>
        </div>

        <div class="screen-grid">

            <article class="screen-card">
                <span class="screen-icon">▤</span>
                <span class="screen-tag">LEARN</span>
                <h2>Academy</h2>
                <p>Learn cybersecurity through guided lessons and beginner-friendly challenges.</p>
                <button class="primary-button" data-route="academy">
                    ENTER ACADEMY →
                </button>
            </article>

            <article class="screen-card">
                <span class="screen-icon purple">◈</span>
                <span class="screen-tag purple-text">PRACTICE</span>
                <h2>Operations</h2>
                <p>Investigate simulated incidents and test your practical skills.</p>
                <button class="primary-button" data-route="operations">
                    START OPERATIONS →
                </button>
            </article>

            <article class="screen-card">
                <span class="screen-icon orange">⚑</span>
                <span class="screen-tag orange-text">COMPETE</span>
                <h2>CTF Arena</h2>
                <p>Take on multi-stage challenges and prove your abilities.</p>
                <button class="primary-button" data-route="ctf">
                    ENTER ARENA →
                </button>
            </article>

        </div>

        <section class="screen-panel">
            <span class="eyebrow">FIRST DEPLOYMENT</span>
            <h2>Phishing Hunter</h2>
            <p>
                Investigate suspicious emails, recognize phishing techniques,
                and distinguish malicious messages from legitimate ones.
            </p>
            <div class="screen-tags">
                <span>CYBER BASICS</span>
                <span>BEGINNER</span>
                <span>5–10 MIN</span>
            </div>
            <button class="primary-button"
                data-route="mission/phishing-hunter/academy">
                VIEW MISSION BRIEFING →
            </button>
        </section>
    `;
}

function modePage(mode) {
    const content = {
        academy: {
            title: "Academy",
            tag: "GUIDED LEARNING",
            description: "Build your cybersecurity knowledge through lessons, explanations, and guided challenges.",
            detail: "Learn at your own pace. Hints and explanations are available without scoring penalties.",
            button: "START LEARNING",
            missionMode: "academy"
        },
        operations: {
            title: "Operations",
            tag: "PRACTICAL TRAINING",
            description: "Enter simulated security incidents and investigate them using your knowledge.",
            detail: "Scenarios can change between attempts. Your performance and investigation skills matter.",
            button: "BEGIN INVESTIGATION",
            missionMode: "operations"
        },
        ctf: {
            title: "CTF Arena",
            tag: "CHALLENGE ENVIRONMENT",
            description: "Test your abilities through multi-stage cybersecurity challenges.",
            detail: "Find hidden clues, solve challenge objectives, and submit flags to prove your progress.",
            button: "VIEW CTF CHALLENGE",
            missionMode: "ctf"
        }
    };

    const selected = content[mode];

    if (!selected) return notFoundPage();

    return `
        <div class="screen-heading">
            <span class="eyebrow">${selected.tag}</span>
            <h1>${selected.title}</h1>
            <p>${selected.description}</p>
        </div>

        <section class="screen-panel">
            <span class="eyebrow">AVAILABLE TRACKS</span>
            <h2>Cyber Basics</h2>
            <p>
                Explore phishing, smishing, social engineering,
                passwords, spoofing, and malware.
            </p>
            <div class="screen-tags">
                <span>6 TOPICS</span>
                <span>BEGINNER FRIENDLY</span>
            </div>
            <button class="primary-button"
                data-route="tracks/cyber-basics/${selected.missionMode}">
                EXPLORE TRACK →
            </button>
        </section>

        <section class="screen-panel">
            <span class="eyebrow">HOW THIS MODE WORKS</span>
            <p>${selected.detail}</p>
        </section>
    `;
}

function trackPage(mode) {
    const validModes = ["academy", "operations", "ctf"];
    const selectedMode = validModes.includes(mode) ? mode : "academy";

    return `
        <div class="screen-heading">
            <span class="eyebrow">CYBERSECURITY TRACK</span>
            <h1>Cyber Basics</h1>
            <p>Understand the foundations of digital security.</p>
        </div>

        <section class="screen-panel">
            <span class="eyebrow">TOPICS IN THIS TRACK</span>
            <div class="topic-list">
                <div>01 <strong>Phishing & Email Security</strong></div>
                <div>02 <strong>Smishing & Social Engineering</strong></div>
                <div>03 <strong>Password Security</strong></div>
                <div>04 <strong>Malware Fundamentals</strong></div>
                <div>05 <strong>Spoofing & Impersonation</strong></div>
                <div>06 <strong>Online Safety</strong></div>
            </div>
        </section>

        <section class="screen-panel">
            <span class="eyebrow">FIRST CHALLENGE</span>
            <h2>Phishing Hunter</h2>
            <p>
                Examine fictional email messages and determine
                whether they are legitimate or malicious.
            </p>
            <div class="screen-tags">
                <span>BEGINNER</span>
                <span>EMAIL INVESTIGATION</span>
            </div>
            <button class="primary-button"
                data-route="mission/phishing-hunter/${selectedMode}">
                OPEN MISSION →
            </button>
        </section>
    `;
}

function missionPage(mode) {
    const validModes = ["academy", "operations", "ctf"];
    const selectedMode = validModes.includes(mode) ? mode : "academy";

    const modeNames = {
        academy: "ACADEMY · GUIDED LEARNING",
        operations: "OPERATIONS · PRACTICE",
        ctf: "CTF ARENA · COMPETITIVE"
    };

    return `
        <div class="screen-heading">
            <span class="eyebrow">MISSION BRIEFING</span>
            <h1>Phishing Hunter</h1>
            <p>${modeNames[selectedMode]}</p>
        </div>

        <section class="screen-panel">
            <span class="eyebrow">MISSION OVERVIEW</span>
            <h2>Something isn't right...</h2>
            <p>
                Your security team has received several suspicious
                email reports. Your task is to investigate the messages
                and identify potential phishing attempts.
            </p>
        </section>

        <section class="screen-panel">
            <span class="eyebrow">YOUR OBJECTIVES</span>
            <div class="topic-list">
                <div>01 <strong>Inspect the sender's email address.</strong></div>
                <div>02 <strong>Examine links and suspicious domains.</strong></div>
                <div>03 <strong>Identify manipulation and urgency.</strong></div>
                <div>04 <strong>Recognize requests for sensitive information.</strong></div>
                <div>05 <strong>Classify each message correctly.</strong></div>
            </div>
        </section>

        <section class="screen-panel">
            <span class="eyebrow">MISSION PARAMETERS</span>
            <div class="screen-tags">
                <span>BEGINNER</span>
                <span>CYBER BASICS</span>
                <span>EMAIL ANALYSIS</span>
            </div>
            <p>
                All messages and organizations in this mission will be fictional
                and simulated for training purposes.
            </p>
            <button class="primary-button" data-action="start-mission"
                data-mode="${selectedMode}">
                ACCEPT MISSION →
            </button>
        </section>
    `;
}

function notFoundPage() {
    return `
        <div class="screen-heading">
            <span class="eyebrow">SYSTEM MESSAGE</span>
            <h1>Screen unavailable</h1>
            <p>This destination does not exist yet.</p>
            <button class="primary-button" data-route="overview">
                RETURN TO OVERVIEW
            </button>
        </div>
    `;
}

export function renderPage(route) {
    switch (route.page) {
        case "overview":
            return overviewPage();

        case "academy":
            return modePage("academy");

        case "operations":
            return modePage("operations");

        case "ctf":
            return modePage("ctf");

        case "tracks":
            return route.item === "cyber-basics"
                ? trackPage(route.mode)
                : notFoundPage();

        case "mission":
            return route.item === "phishing-hunter"
                ? missionPage(route.mode)
                : notFoundPage();

        default:
            return notFoundPage();
    }
}
