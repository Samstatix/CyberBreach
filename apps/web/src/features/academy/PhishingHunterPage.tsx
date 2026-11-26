import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, ShieldAlert, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

type Verdict = "phishing" | "legitimate";
type TrainingEmail = {
  id: string;
  sender: string;
  address: string;
  replyTo: string;
  subject: string;
  date: string;
  body: string;
  verdict: Verdict;
  clues: string[];
  explanation: string;
  hint: string;
};

// These fictional .test addresses are carried forward from the original prototype.
// The messages are rendered as plain text: learners must never visit their links.
const trainingEmails: TrainingEmail[] = [
  {
    id: "email-01",
    sender: "Accounts Department",
    address: "accounts@northstar-payments.test",
    replyTo: "northstar-support@secure-mail.test",
    subject: "URGENT: Your salary payment is on hold",
    date: "Today, 09:14 AM",
    body: "Dear Employee,\n\nWe detected a problem with your salary payment. Your account will be suspended unless you verify your payroll information immediately.\n\nPlease use the link below to restore your payment:\n\nhttp://northstar-payments.verify-account.test\n\nFailure to respond within 2 hours may result in a delayed salary.\n\nAccounts Department",
    verdict: "phishing",
    clues: [
      "The message uses urgency and threatens a financial consequence.",
      "The reply-to address does not match the sender's domain.",
      "The link uses an unfamiliar domain and asks you to verify an account.",
    ],
    explanation: "This is a phishing attempt. It combines urgency, a mismatched reply-to address and an unfamiliar verification link to pressure the recipient into revealing information.",
    hint: "Compare the sender and reply-to addresses. Then inspect the domain shown in the message without opening it.",
  },
  {
    id: "email-02",
    sender: "Human Resources",
    address: "hr@company-internal.test",
    replyTo: "hr@company-internal.test",
    subject: "Reminder: Updated office holiday schedule",
    date: "Today, 10:30 AM",
    body: "Hello Team,\n\nThe updated office holiday schedule is now available in the employee portal.\n\nPlease review the calendar when convenient. No action is required today.\n\nThank you,\nHuman Resources",
    verdict: "legitimate",
    clues: [
      "The sender and reply-to addresses match.",
      "The message does not request passwords or sensitive information.",
      "The message points to a familiar internal resource without pressure.",
    ],
    explanation: "This is a legitimate training email. It provides routine workplace information, does not demand sensitive information and does not use suspicious urgency. Always verify unexpected messages through a known channel.",
    hint: "Look at what the message asks the reader to do. Is it requesting sensitive information or creating pressure?",
  },
  {
    id: "email-03",
    sender: "IT Helpdesk",
    address: "helpdesk@company-internal.test",
    replyTo: "helpdesk@company-internal.test",
    subject: "Scheduled maintenance notice",
    date: "Today, 11:05 AM",
    body: "Hello,\n\nOur internal file server will undergo scheduled maintenance this Friday from 8:00 PM to 9:00 PM.\n\nDuring this period, shared files may be temporarily unavailable.\n\nYou do not need to provide your password or install any software.\n\nIT Helpdesk",
    verdict: "legitimate",
    clues: [
      "The sender and reply-to addresses match.",
      "The message gives a clear maintenance window.",
      "It does not request credentials, payment or unexpected downloads.",
    ],
    explanation: "This is a legitimate maintenance notice in the fictional environment. It provides specific information and does not ask the recipient to perform a risky action.",
    hint: "A maintenance notice can be normal. Check whether the message asks for credentials, payment or an unexpected download.",
  },
  {
    id: "email-04",
    sender: "Cloud Document Service",
    address: "documents@cloud-share-alert.test",
    replyTo: "no-reply@external-mail.test",
    subject: "A document has been shared with you",
    date: "Today, 11:42 AM",
    body: "Hello,\n\nA confidential document has been shared with you.\n\nTo prevent automatic deletion, sign in and review the document within 30 minutes.\n\nOpen document:\nhttp://cloud-share-alert.test/session/verify\n\nIf you cannot access the document, reply with your work email password so our support team can assist.\n\nCloud Document Service",
    verdict: "phishing",
    clues: [
      "The message creates an artificial deadline.",
      "The reply-to address belongs to a different domain.",
      "It explicitly asks for an email password.",
    ],
    explanation: "This is phishing. Legitimate support teams should never ask you to send your password by email. The deadline and unfamiliar link are additional warning signs.",
    hint: "Focus on the request to send a password. Also compare the sender and reply-to domains.",
  },
  {
    id: "email-05",
    sender: "Project Coordinator",
    address: "maya@company-internal.test",
    replyTo: "maya@company-internal.test",
    subject: "Meeting notes from today's project review",
    date: "Today, 12:15 PM",
    body: "Hi Team,\n\nThank you for attending today's project review.\n\nI've attached the meeting notes as a PDF. Please review the action items before our next scheduled meeting.\n\nIf you have questions, contact me through our usual internal channels.\n\nRegards,\nMaya\nProject Coordinator",
    verdict: "legitimate",
    clues: [
      "The sender and reply-to addresses match.",
      "The message refers to an expected workplace activity.",
      "It does not ask for passwords or use suspicious external links.",
    ],
    explanation: "This is a legitimate message in the training scenario. An attachment alone does not prove an email is malicious; context and sender verification matter.",
    hint: "Do not label an email as phishing just because it mentions an attachment. Evaluate the context and the requested action.",
  },
];

export default function PhishingHunterPage() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Verdict>>({});
  const [hintVisible, setHintVisible] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const current = trainingEmails[index];
  const selected = answers[current.id];
  const correctCount = useMemo(
    () => trainingEmails.filter((email) => answers[email.id] === email.verdict).length,
    [answers],
  );

  function submitVerdict(verdict: Verdict) {
    if (selected || showFeedback) return;
    setAnswers((previous) => ({ ...previous, [current.id]: verdict }));
    setShowFeedback(true);
  }

  function nextEmail() {
    if (index === trainingEmails.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((previous) => previous + 1);
    setHintVisible(false);
    setShowFeedback(false);
  }

  function restart() {
    setIndex(0);
    setAnswers({});
    setHintVisible(false);
    setShowFeedback(false);
    setFinished(false);
  }

  if (finished) {
    const percent = Math.round((correctCount / trainingEmails.length) * 100);
    return (
      <section className="section-page phishing-page">
        <Link className="back-link" to="/academy"><ArrowLeft size={14}/> BACK TO ACADEMY</Link>
        <div className="results-screen">
          <span className="eyebrow">GUIDED PRACTICE COMPLETE</span>
          <h1>{percent >= 80 ? "Good investigation." : "Review and try again."}</h1>
          <p>You reviewed all five fictional messages and scored {correctCount} out of {trainingEmails.length}.</p>
          <div className="result-stats">
            <div><strong>{correctCount}/{trainingEmails.length}</strong><span>CORRECT</span></div>
            <div><strong>{percent}%</strong><span>ACCURACY</span></div>
            <div><strong>{trainingEmails.length}</strong><span>MESSAGES</span></div>
          </div>
          <p className="practice-only-note">Practice result only · No XP, leaderboard points or CTF flags are awarded in this browser exercise.</p>
          <div className="result-review">
            <h2>Review the messages</h2>
            {trainingEmails.map((email) => {
              const correct = answers[email.id] === email.verdict;
              return <div className="review-row" key={email.id}><span className={correct ? "review-correct" : "review-wrong"}>{correct ? "✓" : "✕"}</span><div><strong>{email.subject}</strong><small>Your answer: {(answers[email.id] ?? "not answered").toUpperCase()} · Correct: {email.verdict.toUpperCase()}</small></div></div>;
            })}
          </div>
          <button className="primary-button lesson-check-button" onClick={restart}>RESTART PRACTICE</button>
        </div>
      </section>
    );
  }

  return (
    <section className="section-page phishing-page">
      <Link className="back-link" to="/academy"><ArrowLeft size={14}/> BACK TO ACADEMY</Link>
      <div className="eyebrow">GUIDED PRACTICE / EMAIL SECURITY</div>
      <div className="lesson-title-row"><div><h1>Phishing Hunter</h1><p className="section-description">Investigate a fictional inbox. Look for clues before deciding whether each message is legitimate or phishing.</p></div><span className="lesson-duration">{index + 1} / {trainingEmails.length}</span></div>
      <div className="course-progress-panel"><div className="course-progress-copy"><div><strong>Investigation progress</strong><span>{Object.keys(answers).length} of {trainingEmails.length} messages reviewed</span></div><strong>{Math.round((Object.keys(answers).length / trainingEmails.length) * 100)}%</strong></div><div className="course-progress-track"><span style={{width:`${(Object.keys(answers).length / trainingEmails.length) * 100}%`}}/></div></div>

      <div className="phishing-workspace">
        <aside className="phishing-inbox">
          <span className="eyebrow">INCOMING MESSAGES</span>
          <h2>Investigation inbox</h2>
          {trainingEmails.map((email, emailIndex) => (
            <button className={`phishing-inbox-item ${emailIndex === index ? "active" : ""} ${answers[email.id] ? "answered" : ""}`} key={email.id} onClick={() => { if (emailIndex <= index) { setIndex(emailIndex); setHintVisible(false); setShowFeedback(Boolean(answers[email.id])); } }} disabled={emailIndex > index}>
              <span>{String(emailIndex + 1).padStart(2, "0")}</span><div><strong>{email.sender}</strong><small>{email.subject}</small></div>{answers[email.id] && <CheckCircle2 size={15}/>}
            </button>
          ))}
          <p className="phishing-inbox-help">Messages unlock in order so you can focus on one investigation at a time.</p>
        </aside>

        <article className="phishing-email-card">
          <div className="phishing-email-heading"><span className="eyebrow">MESSAGE DETAILS</span><span>{current.date}</span></div>
          <h2>{current.subject}</h2>
          <div className="phishing-metadata"><div><small>FROM</small><strong>{current.sender}</strong><span>{current.address}</span></div><div><small>REPLY-TO</small><strong>{current.replyTo}</strong></div></div>
          <pre className="phishing-email-body">{current.body}</pre>
          <div className="phishing-safety-note"><ShieldAlert size={16}/><p>This is a fictional training email. The displayed links are plain text. Do not open or visit them.</p></div>

          {!showFeedback && (
            <div className="phishing-actions">
              <div><h3>What is your verdict?</h3><p>Use the sender, reply-to, message content and requested action as evidence.</p></div>
              <div className="classification-buttons">
                <button className="classify-button phishing" onClick={() => submitVerdict("phishing")}>PHISHING</button>
                <button className="classify-button legitimate" onClick={() => submitVerdict("legitimate")}>LEGITIMATE</button>
              </div>
              <button className="text-button hint-button" onClick={() => setHintVisible((visible) => !visible)}><Lightbulb size={14}/>{hintVisible ? "HIDE HINT" : "REVEAL HINT"}</button>
              {hintVisible && <p className="phishing-hint">{current.hint}</p>}
            </div>
          )}

          {showFeedback && (
            <div className={`phishing-feedback ${selected === current.verdict ? "correct" : "incorrect"}`} role="status">
              <div className="phishing-feedback-title">{selected === current.verdict ? <ShieldCheck size={18}/> : <ShieldAlert size={18}/>}<strong>{selected === current.verdict ? "Correct classification" : "Not quite — let's learn from it"}</strong></div>
              <p>{current.explanation}</p>
              <strong>What to notice</strong>
              <ul>{current.clues.map((clue) => <li key={clue}>{clue}</li>)}</ul>
              <div className="phishing-feedback-actions"><span>Correct answer: {current.verdict.toUpperCase()}</span><button className="primary-button" onClick={nextEmail}>{index === trainingEmails.length - 1 ? "VIEW RESULTS" : "NEXT MESSAGE"} <ArrowRight size={14}/></button></div>
            </div>
          )}
        </article>
      </div>
      <p className="practice-only-note">Guided learning exercise · Client-side practice only · No competitive points or trusted CTF score.</p>
    </section>
  );
}
