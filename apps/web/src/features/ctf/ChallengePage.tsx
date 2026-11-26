import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, CircleHelp, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../../lib/supabase";
import { findChallenge } from "./challengeCatalog";
import { getChallengeSolution, submitChallengeFlag } from "./challengeService";
import type { ChallengeSolution, FlagSubmission } from "./challengeService";

export default function ChallengePage() {
  const { slug } = useParams();
  const challenge = findChallenge(slug);
  const { user, loading: authLoading } = useAuth();
  const [flag, setFlag] = useState("");
  const [hintCount, setHintCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FlagSubmission | null>(null);
  const [error, setError] = useState("");
  const [solution, setSolution] = useState<ChallengeSolution | null>(null);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    setFlag(""); setHintCount(0); setResult(null); setError(""); setSolution(null); setShowSolution(false);
  }, [challenge?.id]);

  async function loadSolution() {
    if (!challenge || !user || !supabase) return;
    setSolutionLoading(true);
    try {
      const value = await getChallengeSolution(challenge.id);
      setSolution(value);
    } catch {
      // The server intentionally withholds solutions until the user has solved the challenge.
    } finally {
      setSolutionLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function checkExistingSolve() {
      if (!challenge || !user || !supabase) return;
      const { data } = await supabase.from("challenge_solves").select("challenge_id").eq("user_id", user.id).eq("challenge_id", challenge.id).maybeSingle();
      if (active && data) {
        setResult({ correct: true, already_solved: true, points_awarded: 0, message: "You have already solved this challenge." });
        void loadSolution();
      }
    }
    void checkExistingSolve();
    return () => { active = false; };
  }, [challenge?.id, user?.id]);

  if (!challenge) return <Navigate to="/ctf" replace />;
  const activeChallenge = challenge;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!user) { setError("Sign in to submit a scored flag. Learning content remains public."); return; }
    if (!flag.trim()) { setError("Enter a flag before submitting."); return; }
    setBusy(true);
    try {
      const response = await submitChallengeFlag(activeChallenge.id, flag);
      setResult(response);
      if (response.correct) await loadSolution();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "The submission could not be checked.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section-page challenge-page">
      <Link className="back-link" to={`/ctf/${challenge.category}`}><ArrowLeft size={14}/> BACK TO {challenge.category.replaceAll("-", " ").toUpperCase()}</Link>
      <div className="eyebrow">CTF ARENA / {challenge.category.replaceAll("-", " ").toUpperCase()}</div>
      <div className="challenge-heading-row">
        <div><span className={`difficulty-label ${challenge.difficulty}`}>{challenge.difficulty.toUpperCase()}</span><h1>{challenge.title}</h1><p className="section-description">{challenge.summary}</p></div>
        <div className="challenge-points"><strong>{challenge.points}</strong><span>POINTS</span><small>{challenge.estimatedMinutes} MIN EST.</small></div>
      </div>
      <div className="challenge-meta-row">{challenge.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <article className="challenge-brief"><span className="eyebrow">MISSION BRIEF</span><p>{challenge.scenario}</p><h2>Objective</h2><p>{challenge.objective}</p></article>
      <article className="challenge-evidence"><div className="challenge-section-title"><div><span className="eyebrow">SUPPLIED EVIDENCE</span><h2>Review the artifact</h2></div><span>STATIC TRAINING DATA</span></div><pre>{challenge.artifact}</pre></article>
      <article className="challenge-task"><span className="eyebrow">YOUR TASK</span><p>{challenge.task}</p><div className="challenge-prerequisites"><strong>Useful knowledge</strong>{challenge.prerequisites.map((item) => <span key={item}>{item}</span>)}</div><div className="challenge-safety"><ShieldCheck size={16}/><span>{challenge.safety}</span></div></article>
      <article className="challenge-hints"><div className="challenge-section-title"><div><span className="eyebrow">PROGRESSIVE HELP</span><h2>Need a nudge?</h2></div><span>{hintCount}/3 REVEALED</span></div><p>Hints do not reduce your score. Use them to learn how to approach the evidence.</p><div className="hint-list">{challenge.hints.slice(0, hintCount).map((hint, index) => <div className="hint-item" key={index}><span>HINT {index + 1}</span><p>{hint}</p></div>)}</div><button className="secondary-button" type="button" disabled={hintCount >= challenge.hints.length} onClick={() => setHintCount((count) => Math.min(count + 1, challenge.hints.length))}>{hintCount >= 3 ? "ALL HINTS REVEALED" : "REVEAL NEXT HINT"} <ChevronDown size={14}/></button></article>
      <article className="challenge-submit"><div className="challenge-section-title"><div><span className="eyebrow">FLAG SUBMISSION</span><h2>Validate your answer</h2></div><LockKeyhole size={19}/></div>
        {!authLoading && !user && <p className="challenge-auth-note">You can study the challenge without an account. <Link to="/account">Sign in or create a free account</Link> to submit a flag and record points.</p>}
        <form onSubmit={handleSubmit}><label htmlFor="challenge-flag">Flag</label><div className="flag-input-row"><input id="challenge-flag" value={flag} onChange={(event) => setFlag(event.target.value)} placeholder="CB{your_answer}" autoComplete="off" spellCheck={false} maxLength={256}/><button className="primary-button" type="submit" disabled={busy || authLoading || !user || !flag.trim()}>{busy ? "CHECKING…" : "SUBMIT FLAG"} <ArrowRight size={14}/></button></div></form>
        {error && <p className="challenge-feedback error" role="alert">{error}</p>}
        {result && <div className={`challenge-feedback ${result.correct ? "success" : "error"}`} role="status">{result.correct ? <CheckCircle2 size={18}/> : <CircleHelp size={18}/>}<div><strong>{result.message}</strong><p>{result.correct ? result.already_solved ? "No additional points were awarded." : `You earned ${result.points_awarded} points. The walkthrough is now unlocked.` : "Review the evidence, use a hint if needed, and try again."}</p></div></div>}
      </article>
      {result?.correct && <article className="challenge-solution"><div className="challenge-section-title"><div><span className="eyebrow">AFTER-ACTION LEARNING</span><h2>Understand the solve</h2></div><Sparkles size={18}/></div>{solutionLoading && <p>Loading the verified walkthrough…</p>}{solution && <><button className="secondary-button" type="button" onClick={() => setShowSolution((value) => !value)}>{showSolution ? "HIDE WALKTHROUGH" : "OPEN WALKTHROUGH"} <ChevronDown size={14}/></button>{showSolution && <div className="solution-content"><h3>Reasoning</h3><p>{solution.walkthrough_md}</p><h3>Defensive perspective</h3><p>{solution.defensive_notes_md}</p><div className="reflection-question"><strong>Reflect on this</strong><p>{solution.reflection_question}</p></div></div>}</>}</article>}
      <div className="learning-note"><div className="note-symbol">i</div><div><strong>Scoring is server-authoritative</strong><p>The browser never contains the expected flag or the full walkthrough. The database verifies submissions, rate-limits attempts and awards first-solve points atomically.</p></div></div>
    </section>
  );
}
