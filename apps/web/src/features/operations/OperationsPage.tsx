import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
      { id: "opt_a7f93d12c8404b6c9e52a0f1", label: "Delete the authentication logs so the attacker cannot read them." },
      { id: "opt_2c4e8a7f91b34d0ca63e5f82", label: "Preserve the evidence, contain the account/session through the approved process, and verify with the account owner." },
      { id: "opt_f18b4c6d2a9037e5b1c8d640", label: "Immediately shut down every server in the organization." },
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
      { id: "opt_6e9c2f4a8b1d7350c2a6e9f4", label: "Capture the relevant DNS/endpoint evidence, then isolate the workstation using the approved containment control." },
      { id: "opt_14b7d9e2c5f0638a4b1d7e90", label: "Block all DNS traffic for the entire organization without checking scope." },
      { id: "opt_93f0a6c1d8e2457b9f3a0c62", label: "Ignore the event because DNS is normal network traffic." },
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
      { id: "opt_5b1d8e3a9c704f26b2d1a8e5", label: "Assume the service account owner made the change and close the alert." },
      { id: "opt_0e4a9c7d2b6f8135a1d0e7c9", label: "Preserve the audit trail, verify the change with the service owner, and revoke the unauthorized privilege through the approved process." },
      { id: "opt_c8a2f5d1e7b90463a6c1f820", label: "Delete the service account immediately without checking dependencies." },
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
  const [busyMissionIds, setBusyMissionIds] = useState<string[]>([]);
  const completedIds = new Set(progress.completedMissionIds);

  useEffect(() => {
    void syncGuestOperationProgress(user?.id);
  }, [user?.id]);

  async function chooseOption(
    scenario: (typeof scenarios)[number],
    option: (typeof scenarios)[number]["options"][number],
  ) {
    if (!user) return;
    setAnswers((previous) => ({ ...previous, [scenario.id]: option.id }));
    setMissionResults((previous) => {
      const next = { ...previous };
      delete next[scenario.id];
      return next;
    });
    setMissionErrors((previous) => ({ ...previous, [scenario.id]: "" }));
    setBusyMissionIds((previous) => [...previous, scenario.id]);

    try {
      const result = await completeOperationsMission(scenario.id, option.id, user.id);
      setMissionResults((previous) => ({ ...previous, [scenario.id]: result }));
    } catch (error) {
      setMissionErrors((previous) => ({
        ...previous,
        [scenario.id]: error instanceof Error ? error.message : "The mission could not be checked.",
      }));
    } finally {
      setBusyMissionIds((previous) => previous.filter((id) => id !== scenario.id));
    }
  }

  function tryAgain(scenarioId: string) {
    setAnswers((previous) => {
      const next = { ...previous };
      delete next[scenarioId];
      return next;
    });
    setMissionResults((previous) => {
      const next = { ...previous };
      delete next[scenarioId];
      return next;
    });
    setMissionErrors((previous) => ({ ...previous, [scenarioId]: "" }));
  }

  return (
    <section className="section-page operations-page">
      <div className="eyebrow">PRACTICE / CYBER LABS / OPERATIONS</div>
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
        <span>{user ? "Mission results sync to your account." : "Explore the scenarios freely. Sign in to submit answers and earn synchronized XP."}</span>
      </div>

      {!user && (
        <p className="account-public-note">
          <Link to="/account">Sign in or create a free account</Link> to submit responses. Answer checking is performed securely by the server.
        </p>
      )}

      <div className="section-heading">
        <div><span className="eyebrow">INCIDENT RESPONSE CAMPAIGN</span><h2>Choose your response</h2></div>
        <span className="section-note">{scenarios.length} MISSIONS · 100 XP EACH</span>
      </div>

      <div className="incident-list">
        {scenarios.map((scenario, index) => {
          const alreadyCompleted = completedIds.has(scenario.id) || Boolean(missionResults[scenario.id]?.completed);
          const selectedId = answers[scenario.id];
          const selectedOption = scenario.options.find((option) => option.id === selectedId);
          const result = missionResults[scenario.id];
          const error = missionErrors[scenario.id];
          const busy = busyMissionIds.includes(scenario.id);
          const done = alreadyCompleted || Boolean(selectedId) || busy;

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
                    disabled={!user || done}
                    className={selectedId === option.id && result ? (result.correct ? "correct" : "incorrect") : ""}
                    onClick={() => void chooseOption(scenario, option)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {(done || alreadyCompleted) && (
                <div className={"incident-feedback " + (result?.correct || alreadyCompleted ? "correct" : "incorrect")} role="status">
                  <strong>
                    {alreadyCompleted ? "Mission complete." : busy ? "Checking your response…" : result?.correct ? "Good decision." : error ? "Response could not be checked." : "Review the response."}
                  </strong>
                  {alreadyCompleted && <p>This mission has already been completed on your account.</p>}
                  {result && <p>{result.message}</p>}
                  {result?.correct && (
                    <p className="operation-xp-result">
                      {result.xp_awarded > 0
                        ? "+" + result.xp_awarded + " XP earned. Mission saved."
                        : "No additional XP was awarded."}
                    </p>
                  )}
                  {error && <p className="operation-xp-result">{error}</p>}
                  {error && selectedOption && <button type="button" className="text-button" onClick={() => void chooseOption(scenario, selectedOption)}>RETRY CHECK</button>}
                  {result && !result.correct && <button type="button" className="text-button" onClick={() => tryAgain(scenario.id)}>TRY AGAIN</button>}
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
