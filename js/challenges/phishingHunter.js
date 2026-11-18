
const emailLibrary = [
    {
        id: "email-01",
        sender: "Accounts Department",
        address: "accounts@northstar-payments.test",
        replyTo: "northstar-support@secure-mail.test",
        subject: "URGENT: Your salary payment is on hold",
        date: "Today, 09:14 AM",
        body: `Dear Employee,

We detected a problem with your salary payment. Your account will be suspended unless you verify your payroll information immediately.

Please use the link below to restore your payment:

http://northstar-payments.verify-account.test

Failure to respond within 2 hours may result in a delayed salary.

Accounts Department`,
        verdict: "phishing",
        clues: [
            "The message uses urgency and threatens a financial consequence.",
            "The reply-to address does not match the sender's domain.",
            "The link uses an unfamiliar domain and asks you to verify an account."
        ],
        explanation: "This is a phishing attempt. It combines urgency, a mismatched reply-to address, and an unfamiliar verification link to pressure the recipient into revealing information.",
        hint: "Look carefully at the reply-to address and the link."
    },
    {
        id: "email-02",
        sender: "Human Resources",
        address: "hr@company-internal.test",
        replyTo: "hr@company-internal.test",
        subject: "Reminder: Updated office holiday schedule",
        date: "Today, 10:30 AM",
        body: `Hello Team,

The updated office holiday schedule is now available in the employee portal.

Please review the calendar when convenient. No action is required today.

Thank you,
Human Resources`,
        verdict: "legitimate",
        clues: [
            "The sender and reply-to addresses match.",
            "The message does not request passwords or sensitive information.",
            "The message points to a familiar internal resource without pressure."
        ],
        explanation: "This is a legitimate training email. It provides routine workplace information, does not demand sensitive information, and does not use suspicious urgency.",
        hint: "Consider whether the email is asking you to do anything risky."
    },
    {
        id: "email-03",
        sender: "IT Helpdesk",
        address: "helpdesk@company-internal.test",
        replyTo: "helpdesk@company-internal.test",
        subject: "Scheduled maintenance notice",
        date: "Today, 11:05 AM",
        body: `Hello,

Our internal file server will undergo scheduled maintenance this Friday from 8:00 PM to 9:00 PM.

During this period, shared files may be temporarily unavailable.

You do not need to provide your password or install any software.

IT Helpdesk`,
        verdict: "legitimate",
        clues: [
            "The sender and reply-to addresses match.",
            "The message gives a clear maintenance window.",
            "It does not request credentials, payment, or unexpected downloads."
        ],
        explanation: "This is a legitimate maintenance notice in our fictional environment. It provides specific information and does not ask the recipient to perform a risky action.",
        hint: "Look for requests to reveal information or install something."
    },
    {
        id: "email-04",
        sender: "Cloud Document Service",
        address: "documents@cloud-share-alert.test",
        replyTo: "no-reply@external-mail.test",
        subject: "A document has been shared with you",
        date: "Today, 11:42 AM",
        body: `Hello,

A confidential document has been shared with you.

To prevent automatic deletion, sign in and review the document within 30 minutes.

Open document:
http://cloud-share-alert.test/session/verify

If you cannot access the document, reply with your work email password so our support team can assist.

Cloud Document Service`,
        verdict: "phishing",
        clues: [
            "The message creates an artificial deadline.",
            "The reply-to address belongs to a different domain.",
            "It explicitly asks for an email password."
        ],
        explanation: "This is phishing. Legitimate support teams should never ask you to send your password by email. The deadline and unfamiliar link are additional warning signs.",
        hint: "A legitimate service should never ask you to email your password."
    },
    {
        id: "email-05",
        sender: "Project Coordinator",
        address: "maya@company-internal.test",
        replyTo: "maya@company-internal.test",
        subject: "Meeting notes from today's project review",
        date: "Today, 12:15 PM",
        body: `Hi Team,

Thank you for attending today's project review.

I've attached the meeting notes as a PDF. Please review the action items before our next scheduled meeting.

If you have questions, contact me through our usual internal channels.

Regards,
Maya
Project Coordinator`,
        verdict: "legitimate",
        clues: [
            "The sender and reply-to addresses match.",
            "The message refers to an expected workplace activity.",
            "It does not ask for passwords or use suspicious external links."
        ],
        explanation: "This is a legitimate message in the training scenario. An attachment alone does not prove an email is malicious; context and sender verification matter.",
        hint: "Remember: not every attachment or business email is automatically malicious."
    }
];

const modeSettings = {
    academy: {
        name: "ACADEMY",
        description: "Guided learning · Hints available",
        points: 0,
        showHints: true,
        instantFeedback: true
    },
    operations: {
        name: "OPERATIONS",
        description: "Independent investigation · 100 XP per correct answer",
        points: 100,
        showHints: false,
        instantFeedback: true
    },
    ctf: {
        name: "CTF ARENA",
        description: "No hints · Results revealed after submission",
        points: 200,
        showHints: false,
        instantFeedback: false
    }
};

function shuffle(items) {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

export function mountPhishingHunter(container, mode = "academy") {
    const settings = modeSettings[mode] || modeSettings.academy;

    const emails = mode === "operations" || mode === "ctf"
        ? shuffle(emailLibrary)
        : [...emailLibrary];

    let selectedEmail = emails[0].id;
    let answers = {};
    let hintsUsed = {};
    let finished = false;
    let flagSubmitted = false;
    let flagMessage = "";

    function getSelectedEmail() {
        return emails.find(email => email.id === selectedEmail);
    }

    function getScore() {
        return Object.entries(answers).reduce((total, [id, answer]) => {
            const email = emails.find(item => item.id === id);
            return total + (
                email && email.verdict === answer
                    ? settings.points
                    : 0
            );
        }, 0);
    }

    function renderInbox() {
        return emails.map((email, index) => {
            const answered = answers[email.id] !== undefined;
            const active = selectedEmail === email.id;

            return `
                <button
                    class="inbox-item ${active ? "selected" : ""} ${answered ? "answered" : ""}"
                    data-email="${email.id}"
                    ${finished ? "disabled" : ""}
                >
                    <span class="inbox-number">${String(index + 1).padStart(2, "0")}</span>
                    <span class="inbox-info">
                        <strong>${escapeHTML(email.sender)}</strong>
                        <span>${escapeHTML(email.subject)}</span>
                    </span>
                    <span class="inbox-state">
                        ${answered ? "✓" : "○"}
                    </span>
                </button>
            `;
        }).join("");
    }

    function renderEmail() {
        const email = getSelectedEmail();
        const answer = answers[email.id];
        const correct = answer === email.verdict;
        const showFeedback = answer !== undefined &&
            settings.instantFeedback;

        return `
            <div class="email-view">
                <div class="email-header">
                    <div class="email-subject">
                        <span class="eyebrow">MESSAGE DETAILS</span>
                        <h2>${escapeHTML(email.subject)}</h2>
                    </div>
                    <span class="email-date">${escapeHTML(email.date)}</span>
                </div>

                <div class="email-metadata">
                    <div>
                        <span>FROM</span>
                        <strong>${escapeHTML(email.sender)}</strong>
                        <small>${escapeHTML(email.address)}</small>
                    </div>
                    <div>
                        <span>REPLY-TO</span>
                        <strong>${escapeHTML(email.replyTo)}</strong>
                    </div>
                </div>

                <div class="email-body">
                    ${escapeHTML(email.body)}
                </div>

                <div class="investigation-note">
                    <span>INVESTIGATION TIP</span>
                    <p>Inspect the sender, message content, requests, and any links before making your decision.</p>
                </div>

                ${settings.showHints && !finished ? `
                    <div class="hint-area">
                        <button class="secondary-button" data-action="hint"
                            ${hintsUsed[email.id] ? "disabled" : ""}>
                            ${hintsUsed[email.id] ? "HINT REVEALED" : "REVEAL HINT"}
                        </button>
                        ${hintsUsed[email.id] ? `
                            <p class="hint-text">${escapeHTML(email.hint)}</p>
                        ` : ""}
                    </div>
                ` : ""}

                ${answer === undefined && !finished ? `
                    <div class="classification-area">
                        <h3>Classify this message</h3>
                        <p>What do you think this email is?</p>
                        <div class="classification-buttons">
                            <button class="classify-button phishing"
                                data-answer="phishing">
                                ⚠ PHISHING
                            </button>
                            <button class="classify-button legitimate"
                                data-answer="legitimate">
                                ✓ LEGITIMATE
                            </button>
                        </div>
                    </div>
                ` : ""}

                ${showFeedback ? `
                    <div class="feedback-panel ${correct ? "correct" : "incorrect"}">
                        <strong>${correct ? "CORRECT CLASSIFICATION" : "INCORRECT CLASSIFICATION"}</strong>
                        <p>${escapeHTML(email.explanation)}</p>
                        <p><strong>Correct answer:</strong> ${email.verdict.toUpperCase()}</p>
                        <div class="clue-list">
                            ${email.clues.map(clue => `<div>✓ ${escapeHTML(clue)}</div>`).join("")}
                        </div>
                    </div>
                ` : ""}

                ${answer !== undefined && !settings.instantFeedback && !finished ? `
                    <div class="waiting-panel">
                        <strong>CLASSIFICATION RECORDED</strong>
                        <p>Your answer has been saved. Results will be revealed after final submission.</p>
                    </div>
                ` : ""}
            </div>
        `;
    }

    function renderResults() {
        const correctCount = emails.filter(email =>
            answers[email.id] === email.verdict
        ).length;

        const total = emails.length;
        const percentage = Math.round(correctCount / total * 100);

        return `
            <div class="results-screen">
                <span class="eyebrow">INVESTIGATION COMPLETE</span>
                <h2>${percentage >= 80 ? "Excellent work, Operative." : "Investigation report ready."}</h2>
                <p>You have reviewed all five messages.</p>

                <div class="result-stats">
                    <div>
                        <strong>${correctCount}/${total}</strong>
                        <span>CORRECT</span>
                    </div>
                    <div>
                        <strong>${percentage}%</strong>
                        <span>ACCURACY</span>
                    </div>
                    <div>
                        <strong>${getScore()}</strong>
                        <span>POINTS</span>
                    </div>
                </div>

                <div class="result-review">
                    <h3>Investigation review</h3>
                    ${emails.map(email => {
                        const correct = answers[email.id] === email.verdict;

                        return `
                            <div class="review-row">
                                <span class="${correct ? "review-correct" : "review-wrong"}">
                                    ${correct ? "✓" : "✕"}
                                </span>
                                <div>
                                    <strong>${escapeHTML(email.subject)}</strong>
                                    <small>
                                        Your answer: ${answers[email.id].toUpperCase()}
                                        · Correct: ${email.verdict.toUpperCase()}
                                    </small>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>

                ${mode === "ctf" ? `
                    <div class="flag-panel">
                        <span class="eyebrow">FINAL FLAG</span>
                        <p>Submit the training flag to complete this CTF exercise.</p>
                        <input class="flag-input" id="ctf-flag"
                            placeholder="CB{ENTER_FLAG_HERE}"
                            autocomplete="off"
                            ${flagSubmitted ? "disabled" : ""}>
                        <button class="primary-button" data-action="submit-flag"
                            ${flagSubmitted ? "disabled" : ""}>
                            SUBMIT FLAG
                        </button>
                        ${flagMessage ? `<p class="flag-message">${escapeHTML(flagMessage)}</p>` : ""}
                    </div>
                ` : ""}

                <button class="primary-button" data-action="restart">
                    RESTART MISSION
                </button>
            </div>
        `;
    }

    function render() {
        const completed = Object.keys(answers).length;
        const progress = completed / emails.length * 100;

        container.innerHTML = `
            <div class="game-screen">

                <div class="game-titlebar">
                    <div>
                        <span class="eyebrow">CYBER BASICS / EMAIL SECURITY</span>
                        <h1>Phishing Hunter</h1>
                        <p>${settings.description}</p>
                    </div>
                    <span class="game-mode-label">${settings.name}</span>
                </div>

                <div class="game-progress">
                    <div>
                        <span>INVESTIGATION PROGRESS</span>
                        <strong>${completed} / ${emails.length} EMAILS</strong>
                    </div>
                    <div class="game-progress-track">
                        <div style="width:${progress}%"></div>
                    </div>
                </div>

                ${finished ? renderResults() : `
                    <div class="investigation-layout">
                        <aside class="inbox-panel">
                            <div class="inbox-heading">
                                <div>
                                    <span class="eyebrow">INCOMING MESSAGES</span>
                                    <h2>Investigation Inbox</h2>
                                </div>
                                <span class="inbox-count">${emails.length}</span>
                            </div>
                            <p class="inbox-instruction">Select a message to inspect it.</p>
                            <div class="inbox-list">
                                ${renderInbox()}
                            </div>
                        </aside>

                        <section class="email-panel">
                            ${renderEmail()}
                        </section>
                    </div>
                `}

                <div class="game-footer">
                    <span>SIMULATED TRAINING ENVIRONMENT</span>
                    <button class="text-button" data-action="exit">
                        ← EXIT MISSION
                    </button>
                </div>
            </div>
        `;

        if (mode === "ctf" && finished && !flagSubmitted) {
            const flagInput = container.querySelector("#ctf-flag");
            if (flagInput) {
                flagInput.addEventListener("keydown", event => {
                    if (event.key === "Enter") submitFlag();
                });
            }
        }
    }

    function submitAnswer(answer) {
        if (finished || answers[selectedEmail] !== undefined) return;

        answers[selectedEmail] = answer;

        if (Object.keys(answers).length === emails.length) {
            finished = true;
        }

        render();
    }

    function submitFlag() {
        const input = container.querySelector("#ctf-flag");
        const submitted = input?.value.trim() || "";

        if (submitted === "CB{INBOX_SECURED}") {
            flagSubmitted = true;
            flagMessage = "FLAG ACCEPTED — TRAINING CHALLENGE COMPLETE.";
        } else {
            flagMessage = "Incorrect flag. Review the challenge objective and try again.";
        }

        render();
    }

    function restart() {
        answers = {};
        hintsUsed = {};
        selectedEmail = emails[0].id;
        finished = false;
        flagSubmitted = false;
        flagMessage = "";
        render();
    }

    function handleClick(event) {
        const emailButton = event.target.closest("[data-email]");

        if (emailButton && !finished) {
            selectedEmail = emailButton.dataset.email;
            render();
            return;
        }

        const answerButton = event.target.closest("[data-answer]");

        if (answerButton) {
            submitAnswer(answerButton.dataset.answer);
            return;
        }

        const actionButton = event.target.closest("[data-action]");

        if (!actionButton) return;

        switch (actionButton.dataset.action) {
            case "hint": {
                const email = getSelectedEmail();
                hintsUsed[email.id] = true;
                render();
                break;
            }

            case "restart":
                restart();
                break;

            case "exit":
                window.location.hash = `#/tracks/cyber-basics/${mode}`;
                break;

            case "submit-flag":
                submitFlag();
                break;
        }
    }

    container.addEventListener("click", handleClick);
    render();

    return function cleanup() {
        container.removeEventListener("click", handleClick);
    };
}
