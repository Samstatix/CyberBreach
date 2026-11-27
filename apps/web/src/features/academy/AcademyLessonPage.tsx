import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Circle, CircleHelp, ExternalLink, Lightbulb } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { findLesson } from "./academyContent";
import { getCompletedLessonIds, loadCompletedLessonIds, markLessonComplete } from "../../lib/academyProgress";
import { useAuth } from "../auth/AuthProvider";

export default function AcademyLessonPage() {
  const { lessonId } = useParams();
  const found = findLesson(lessonId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState("");
  const [checked, setChecked] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>(() => getCompletedLessonIds(user?.id));
  const [completionBusy, setCompletionBusy] = useState(false);
  const [completionError, setCompletionError] = useState("");

  useEffect(() => { setSelectedOption(""); setChecked(false); setCompletionError(""); }, [lessonId]);
  useEffect(() => {
    let active = true;
    void loadCompletedLessonIds(user?.id).then((ids) => { if (active) setCompletedIds(ids); });
    return () => { active = false; };
  }, [user?.id]);

  if (!found) return <Navigate to="/academy" replace />;
  const { course, lesson, index } = found;
  const isCorrect = checked && selectedOption === lesson.correctOption;
  const alreadyComplete = completedIds.includes(lesson.id);
  const nextLesson = course.lessons[index + 1];

  async function completeLesson() {
    setCompletionError("");
    if (alreadyComplete) {
      if (nextLesson) navigate(`/academy/lessons/${nextLesson.id}`);
      else navigate(`/academy/courses/${course.id}`);
      return;
    }
    setCompletionBusy(true);
    try {
      const result = await markLessonComplete(lesson.id, user?.id);
      setCompletedIds(result.completedIds);
      if (nextLesson) navigate(`/academy/lessons/${nextLesson.id}`);
      else navigate(`/academy/courses/${course.id}`);
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : "Your lesson could not be saved. Please try again.");
    } finally {
      setCompletionBusy(false);
    }
  }

  return (
    <section className="section-page lesson-page">
      <Link className="back-link" to={`/academy/courses/${course.id}`}><ArrowLeft size={14}/> BACK TO {course.title.toUpperCase()}</Link>
      <div className="eyebrow">LESSON {String(index + 1).padStart(2, "0")} / {course.title.toUpperCase()}</div>
      <div className="lesson-title-row"><div><h1>{lesson.title}</h1><p className="section-description">{lesson.summary}</p></div><span className="lesson-duration"><BookOpen size={14}/>{lesson.duration}</span></div>
      <div className="lesson-objectives"><strong>By the end of this lesson, you should be able to:</strong><ul>{lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></div>
      <div className="lesson-body">{lesson.blocks.map((block, blockIndex) => <article className="lesson-block" key={block.heading}><span className="lesson-block-index">PART {String(blockIndex + 1).padStart(2, "0")}</span><h2>{block.heading}</h2>{(block.paragraphs ?? []).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{block.bullets && <ul>{block.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}{block.callout && <div className="lesson-callout"><Lightbulb size={17}/><p>{block.callout}</p></div>}</article>)}</div>
      <article className="lesson-example"><div className="lesson-example-heading"><BookOpen size={18}/><div><span className="eyebrow">WORKED EXAMPLE</span><h2>{lesson.workedExample.title}</h2></div></div><ol>{lesson.workedExample.steps.map((step) => <li key={step}>{step}</li>)}</ol><p className="example-takeaway">{lesson.workedExample.takeaway}</p></article>
      <article className="key-terms-panel"><span className="eyebrow">QUICK GLOSSARY</span><h2>Words worth knowing</h2><div className="key-terms-grid">{lesson.keyTerms.map((term) => <div key={term.term}><strong>{term.term}</strong><p>{term.definition}</p></div>)}</div></article>
      <article className="knowledge-check">
        <div className="knowledge-check-heading"><CircleHelp size={20}/><div><span className="eyebrow">CHECK YOUR UNDERSTANDING</span><h2>Knowledge check</h2></div></div>
        <p className="knowledge-question">{lesson.question}</p>
        <div className="knowledge-options">{lesson.options.map((option) => <button type="button" className={`knowledge-option ${selectedOption === option.id ? "selected" : ""} ${checked && option.id === lesson.correctOption ? "correct" : ""} ${checked && selectedOption === option.id && !isCorrect ? "incorrect" : ""}`} key={option.id} onClick={() => { setSelectedOption(option.id); setChecked(false); }} aria-pressed={selectedOption === option.id}><span>{selectedOption === option.id ? <CheckCircle2 size={16}/> : <Circle size={16}/>}</span>{option.label}</button>)}</div>
        {!checked && <button className="primary-button lesson-check-button" disabled={!selectedOption} onClick={() => setChecked(true)}>CHECK ANSWER <ArrowRight size={15}/></button>}
        {checked && <div className={`quiz-feedback ${isCorrect ? "correct" : "incorrect"}`} role="status"><strong>{isCorrect ? "That's right." : "Not quite. Try again."}</strong><p>{lesson.feedback}</p>{!isCorrect && <button type="button" className="text-button" onClick={() => { setSelectedOption(""); setChecked(false); }}>TRY AGAIN</button>}</div>}
        {isCorrect && <><p className="lesson-xp-note">Completing this lesson earns 25 XP and updates your operator profile.</p><button className="primary-button lesson-check-button" onClick={() => void completeLesson()} disabled={completionBusy}>{completionBusy ? "SAVING…" : alreadyComplete ? "CONTINUE" : "MARK COMPLETE · +25 XP"} <ArrowRight size={15}/></button></>}
        {completionError && <p className="account-status error" role="alert">{completionError}</p>}
        {alreadyComplete && <p className="already-complete"><CheckCircle2 size={14}/> You have completed this lesson before.</p>}
      </article>
      <article className="further-reading"><span className="eyebrow">GO DEEPER</span><h2>Further reading</h2><p>These independent resources can help you explore the subject in more depth. The lesson above is written by CollabCircle.</p>{lesson.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<ExternalLink size={13}/></a>)}</article>
    </section>
  );
}
