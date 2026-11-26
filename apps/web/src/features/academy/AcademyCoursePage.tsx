import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Circle, Clock3 } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { findCourse } from "./academyContent";
import { getCompletedLessonIds, loadCompletedLessonIds } from "../../lib/academyProgress";
import { useAuth } from "../auth/AuthProvider";

export default function AcademyCoursePage(){
 const {courseId}=useParams();const course=findCourse(courseId);const {user}=useAuth();
 const [completed,setCompleted]=useState<string[]>(()=>getCompletedLessonIds(user?.id));
 useEffect(()=>{let active=true;void loadCompletedLessonIds(user?.id).then(ids=>{if(active)setCompleted(ids);});return()=>{active=false;};},[user?.id]);
 if(!course)return <Navigate to="/academy" replace/>;
 const completedCount=course.lessons.filter(lesson=>completed.includes(lesson.id)).length;
 const percentage=Math.round(completedCount/course.lessons.length*100);
 return <section className="section-page academy-course-page">
  <Link className="back-link" to="/academy"><ArrowLeft size={14}/> BACK TO ACADEMY</Link><div className="eyebrow">CYBER ACADEMY / LEARNING PATH</div><span className="course-level">{course.level}</span><h1>{course.title}</h1><p className="section-description">{course.description}</p>
  <div className="course-progress-panel"><div className="course-progress-copy"><div><strong>Your progress</strong><span>{completedCount} of {course.lessons.length} lessons completed</span></div><strong>{percentage}%</strong></div><div className="course-progress-track"><span style={{width:`${percentage}%`}}/></div></div>
  <div className="course-outcomes"><h2>What you will be able to do</h2><ul>{course.outcomes.map(outcome=><li key={outcome}><CheckCircle2 size={15}/>{outcome}</li>)}</ul></div>
  <div className="section-heading"><div><span className="eyebrow">COURSE CONTENT</span><h2>Lessons in this path</h2></div><span className="section-note">{course.lessons.length} LESSONS</span></div>
  <div className="lesson-list">{course.lessons.map((lesson,index)=>{const isComplete=completed.includes(lesson.id);return <Link className="lesson-row" to={`/academy/lessons/${lesson.id}`} key={lesson.id}><span className="lesson-number">{String(index+1).padStart(2,"0")}</span><span className="lesson-status">{isComplete?<CheckCircle2 size={18}/>:<Circle size={18}/>}</span><span className="lesson-row-copy"><strong>{lesson.title}</strong><small>{lesson.summary}</small></span><span className="lesson-duration"><Clock3 size={13}/>{lesson.duration}</span><ArrowRight className="lesson-arrow" size={16}/></Link>;})}</div>
  <div className="academy-footnote"><BookOpen size={15}/>{user?"Your completed lessons are synced to your account.":"Guest progress is stored in this browser."} Complete each knowledge check to record learning progress.</div>
 </section>;
}
