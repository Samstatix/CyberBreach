import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, Trophy } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { usePlayerProgress } from "../progression/progressionService";
import { completeOperationsMission, syncGuestOperationProgress } from "../../lib/operationsProgress";
import type { OperationMissionResult } from "../../lib/operationsProgress";

const scenarios = [
  {
    id: "auth-burst",
    title: "Unusual account activity",
    severity: "HIGH",
    context: "The identity monitor reports 18 failed sign-ins for one account from a single source address, followed by one successful login. The account owner says they were not online.",
    evidence: [
      "08:12 — 6 failed password attempts",
      "08:14 — 12 failed password attempts",
      "08:15 — successful sign-in from the same source",
      "08:17 — new MFA recovery method added",
    ],
    question: "What is the best first response?",
    options: [
      { id: "delete-logs", label: "Delete the authentication logs so the attacker cannot read them.", correct: false, feedback: "Never destroy evidence. Preserve the logs and record the incident timeline." },
      { id: "preserve-contain-verify", label: "Preserve the evidence, contain the account/session through the approved process, and verify with the account owner.", correct: true, feedback: "Correct. Preserve evidence, contain the suspected compromised identity and verify the activity through a trusted channel." },
      { id: "shutdown-all", label: "Immediately shut down every server in the organization.", correct: false, feedback: "This is disproportionate and may destroy evidence or cause unnecessary disruption. Contain the affected identity first." },
    ],
    lesson: "A successful login after a password-guessing burst is not automatically proof of compromise, but the unrequested recovery-method change raises the risk. Preserve logs, contain the identity and validate the event.",
  },
  {
    id: "dns-burst",
    title: "Unexpected outbound DNS",
    severity: "MEDIUM",
    context: "A workstation makes hundreds of DNS queries with unusually long, high-entropy subdomain labels. The endpoint also contacts a newly observed domain.",
    evidence: [
      "Query count is 24× the workstation's baseline",
      "Subdomain labels are unusually long",
      "The same endpoint generated the burst",
      "No approved software change is recorded",
    ],
    question: "Which action best balances containment and evidence preservation?",
    options: [
      { id: "preserve-isolate", label: "Capture the relevant DNS/endpoint evidence, then isolate the workstation using the approved containment control.", correct: true, feedback: "Correct. Preserve the evidence and contain the suspected endpoint without disrupting unrelated DNS services." },
      { id: "block-all-dns", label: "Block all DNS traffic for the entire organization without checking scope.", correct: false, feedback: "A broad outage can disrupt business and may not contain the affected host. Use a scoped response." },
      { id: "ignore-dns", label: "Ignore the event because DNS is normal network traffic.", correct: false, feedback: "DNS is normal, but unusual volume and label entropy can indicate tunnelling or other suspicious behavior." },
    ],
    lesson: "DNS is a common service and also a possible data channel. Compare activity with a baseline, preserve query evidence, identify the affected host and apply scoped containment.",
  },
  {
    id: "priv-change",
    title: "Unexpected privileged change",
    severity: "CRITICAL",
    context: "A production service account receives a new administrator role outside the approved maintenance window. The change record has no matching ticket.",
    evidence: [
      "Actor: svc-deploy-04",
      "Change: role analyst → administrator",
      "Ticket reference: none",
      "Time: outside the published change window",
    ],
    question: "What should the incident responder do next?",
    options: [
      { id: "assume-approved", label: "Assume the service account owner made the change and close the alert.", correct: false, feedback: "The absence of an approved ticket means the change needs validation. Do not assume intent." },
      { id: "preserve-verify-revoke", label: "Preserve the audit trail, verify the change with the service owner, and revoke the unauthorized privilege through the approved process.", correct: true, feedback: "Correct. Validate the change, preserve evidence and remove unauthorized access with a documented response." },
      { id: "delete-account", label: "Delete the service account immediately without checking dependencies.", correct: false, feedback: "An immediate deletion can interrupt production and destroy context. Follow the incident process and validate dependencies." },
    ],
    lesson: "Privileged changes need traceable approval. Correlate identity, ticket, timestamp and deployment context. If unauthorized, contain the privilege and rotate affected credentials after preserving the evidence.",
  },
];

export default function OperationsPage() {
  const { user } = useAuth();
  const { progress } = usePlayerProgress(user?.id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [missionResults, setMissionResults] = useState<Record<string, OperationMissionResult>>({});
  const [missionErrors, setMissionErrors] = useState<Record<string, string>>({});
  const completedIds = new Set(progress.completedMissionIds);

  useEffect(() => {
    if (user?.id) {
      void syncGuestOperationProgress(user.id).catch((error: unknown) => {
        console.warn("Guest Operations progress could not be synchronized:", error);
      });
    }
  }, [user?.id]);

  async function chooseOption(
    scenario: (typeof scenarios)[number],
    option: (typeof scenarios)[number]["options"][number],
  ) {
    setAnswers((previous) => ({ ...previous, [scenario.id]: option.id }));
    setMissionErrors((previous) => ({ ...previous, [scenario.id]: "" }));
    if (!option.correct) return;

    try {
      const result = await completeOperationsMission(scenario.id, option.id, user?.id);
      setMissionResults((previous) => ({ ...previous, [scenario.id]: result }));
    } catch (error) {
      setMissionErrors((previous) => ({
        ...previous,
        [scenario.id]: error instanceof Error ? error.message : "The mission could not be saved.",
      }));
    }
  }

  return (
    <section className="section-page operations-page">
      <div className="eyebrow">INVESTIGATE / OPERATIONS MISSIONS</div>
      <h1>Think like an incident responder.</h1>
      <p className="section-description">Work through fictional security incidents. Read the evidence, choose a proportionate response and learn why the decision matters. These are practice scenarios, not live alerts.</p>

      <div className="operations-principles">
        <div><ShieldCheck size={19}/><strong>Preserve evidence</strong><span>Keep logs and timelines intact.</span></div>
        <div><Activity size={19}/><strong>Scope the impact</strong><span>Contain the affected system or identity.</span></div>
        <div><AlertTriangle size={19}/><strong>Verify before acting</strong><span>Use approved response procedures.</span></div>
      </div>

      <div className="operations-mission-progress">
        <div><span className="eyebrow">CAMPAIGN PROGRESS</span><strong>{progress.missionsCompleted} / {scenarios.length} MISSIONS COMPLETE</strong></div>
        <div className="operations-mission-track"><span style={{ width: Math.min(100, progress.missionsCompleted / scenarios.length * 100) + "%" }}/></div>
        <span>{user ? "Mission results sync to your account." : "Guest results are saved in this browser. Sign in to sync across devices."}</span>
      </div>

      <div className="section-heading">
        <div><span className="eyebrow">INCIDENT RESPONSE CAMPAIGN</span><h2>Choose your response</h2></div>
        <span className="section-note">{scenarios.length} MISSIONS · 100 XP EACH</span>
      </div>

      <div className="incident-list">
        {scenarios.map((scenario, index) => {
          const alreadyCompleted = completedIds.has(scenario.id) || Boolean(missionResults[scenario.id]?.completed);
          const selectedId = alreadyCompleted ? scenario.options.find((option) => option.correct)?.id : answers[scenario.id];
          const selectedOption = scenario.options.find((option) => option.id === selectedId);
          const done = Boolean(selectedId);
          const result = missionResults[scenario.id];
          const error = missionErrors[scenario.id];

          return (
            <article className="incident-card" key={scenario.id}>
              <div className="incident-card-head">
                <div><span className="eyebrow">MISSION {String(index + 1).padStart(2, "0")}</span><h2>{scenario.title}</h2></div>
                <span className={"incident-severity " + scenario.severity.toLowerCase()}>{scenario.severity}</span>
              </div>
              <p>{scenario.context}</p>
              <div className="incident-evidence"><strong>Evidence timeline</strong>{scenario.evidence.map((item) => <span key={item}>{item}</span>)}</div>
              <h3>{scenario.question}</h3>

              <div className="incident-options">
                {scenario.options.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    disabled={done}
                    className={done && selectedId === option.id ? (option.correct ? "correct" : "incorrect") : ""}
                    onClick={() => void chooseOption(scenario, option)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {done && selectedOption && (
                <div className={"incident-feedback " + (selectedOption.correct ? "correct" : "incorrect")} role="status">
                  <strong>{selectedOption.correct ? "Good decision." : "Review the response."}</strong>
                  <p>{selectedOption.feedback}</p>
                  {selectedOption.correct && (
                    <p className="operation-xp-result">
                      {error
                        ? "Your answer is correct, but saving failed: " + error
                        : result
                          ? result.correct
                            ? result.xp_awarded > 0
                              ? "+" + result.xp_awarded + " XP earned. Mission saved."
                              : "Mission already completed. No additional XP awarded."
                            : result.message
                          : alreadyCompleted
                            ? "Mission completion is saved to your profile."
                            : "Saving your mission result…"}
                    </p>
                  )}
                  {error && selectedOption.correct && <button type="button" className="text-button" onClick={() => void chooseOption(scenario, selectedOption)}>RETRY SAVE</button>}
                  {!selectedOption.correct && <button type="button" className="text-button" onClick={() => setAnswers((previous) => { const next = { ...previous }; delete next[scenario.id]; return next; })}>TRY AGAIN</button>}
                  <button type="button" className="text-button" onClick={() => setRevealed((previous) => ({ ...previous, [scenario.id]: !previous[scenario.id] }))}>
                    {revealed[scenario.id] ? "HIDE LESSON" : "WHY THIS MATTERS"} <ArrowRight size={13}/>
                  </button>
                  {revealed[scenario.id] && <p className="incident-lesson">{scenario.lesson}</p>}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="operations-completion-note">
        <Trophy size={18}/>
        <div><strong>Every correct response earns 100 XP, once per mission.</strong><p>Mission XP contributes to your personal operator rank and Incident Response skill tree. It does not affect the competitive CTF leaderboard.</p></div>
      </div>

      <div className="learning-note">
        <div className="note-symbol"><CheckCircle2 size={14}/></div>
        <div><strong>Practice is not an operational instruction</strong><p>Real incidents must follow your organization's incident-response plan, legal obligations and authorized escalation process.</p></div>
      </div>
    </section>
  );
}
