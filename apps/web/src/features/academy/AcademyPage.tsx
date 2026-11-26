import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, GraduationCap, Network, Shield, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { academyCourses } from "./academyContent";
import { getCompletedLessonIds, loadCompletedLessonIds } from "../../lib/academyProgress";
import { useAuth } from "../auth/AuthProvider";

const courseIcons:Record<string,LucideIcon>={"cybersecurity-fundamentals":Shield,"networking-essentials":Network,"linux-foundations":Terminal};

export default function AcademyPage(){
 const {user}=useAuth();
 const [completedIds,setCompletedIds]=useState<string[]>(()=>getCompletedLessonIds(user?.id));
 useEffect(()=>{let active=true;void loadCompletedLessonIds(user?.id).then(ids=>{if(active)setCompletedIds(ids);});return()=>{active=false;};},[user?.id]);
 return <section className="section-page">
  <div className="eyebrow">LEARN / CYBER ACADEMY</div><h1>Build understanding, not just vocabulary.</h1>
  <p className="section-description">Start from zero. Every lesson explains the idea in plain language, introduces the correct technical terms, walks through an example and checks whether you understood it.</p>
  <div className="academy-promise"><BookOpen size={21}/><div><strong>How every lesson is taught</strong><p>Why it matters → simple explanation → technical detail → worked example → glossary → knowledge check.</p></div></div>
  <div className="section-heading"><div><span className="eyebrow">AVAILABLE LEARNING PATHS</span><h2>Choose your starting point</h2></div><span className="section-note">{academyCourses.length} COURSES · FREE</span></div>
  <div className="academy-grid">{academyCourses.map(course=>{const Icon=courseIcons[course.id]??GraduationCap;const completeCount=course.lessons.filter(lesson=>completedIds.includes(lesson.id)).length;const progress=Math.round(completeCount/course.lessons.length*100);return <article className="academy-card" key={course.id}><div className="academy-card-head"><span className="area-icon"><Icon size={20}/></span><span className="area-tag">{course.level}</span></div><h3>{course.title}</h3><p>{course.description}</p><div className="topic-list">{course.outcomes.map(outcome=><span key={outcome}>{outcome}</span>)}</div><div className="course-mini-progress"><span>{completeCount}/{course.lessons.length} lessons completed</span><strong>{progress}%</strong><div><i style={{width:`${progress}%`}}/></div></div><Link to={`/academy/courses/${course.id}`}>{progress>0?"CONTINUE LEARNING":"OPEN LEARNING PATH"} <ArrowRight size={14}/></Link></article>;})}</div>
  <div className="section-heading"><div><span className="eyebrow">GUIDED PRACTICE</span><h2>Learn by investigating</h2></div><span className="section-note">PRACTICE MODE</span></div>
  <Link className="practice-feature-card" to="/academy/phishing-hunter"><span className="practice-feature-icon"><GraduationCap size={22}/></span><div><strong>Phishing Hunter</strong><p>Inspect five fictional emails. Look at sender details, reply-to addresses, message pressure and suspicious requests. Get explanations after each decision.</p><small>EMAIL SECURITY · GUIDED PRACTICE · NO COMPETITIVE POINTS</small></div><ArrowRight size={18}/></Link>
  <p className="content-disclaimer">{user?"Your signed-in lesson progress is synced to your account.":"Guest lesson progress is stored in this browser only."} Lesson completion is separate from competitive CTF scoring.</p>
 </section>;
}
