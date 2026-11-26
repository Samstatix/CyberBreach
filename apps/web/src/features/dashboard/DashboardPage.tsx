import { ArrowUpRight, BookOpen, Flag, FlaskConical, ShieldCheck, Terminal } from "lucide-react";
import { Link } from "react-router-dom";

const areas = [
  { title: "Cyber Academy", desc: "Understand the idea first. Learn the tools and techniques one small step at a time.", tag: "LEARN", to: "/academy", icon: BookOpen },
  { title: "CTF Arena", desc: "Six focused categories, serious challenges and hints that teach you how to think.", tag: "CHALLENGE", to: "/ctf", icon: Flag },
  { title: "Cyber Labs", desc: "Practice investigation and security skills in controlled training environments.", tag: "PRACTICE", to: "/labs", icon: FlaskConical },
  { title: "Operations", desc: "Work through realistic incident scenarios and explain your decisions.", tag: "INVESTIGATE", to: "/operations", icon: ShieldCheck },
];

export default function DashboardPage() {
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow"><span className="online-dot" /> CYBERSECURITY TRAINING PLATFORM</div>
          <h1>Learn the skill.<br /><em>Master the challenge.</em></h1>
          <p className="hero-copy">Cybersecurity can feel complicated. We break it into clear explanations, guided practice and challenging missions that help you build real understanding.</p>
          <Link className="primary-button" to="/academy">START LEARNING <ArrowUpRight size={16} /></Link>
        </div>
        <div className="hero-emblem"><div className="emblem-ring"><ShieldCheck size={58} strokeWidth={1.1} /></div><span>THINK · TEST · LEARN</span></div>
      </section>
      <div className="section-heading"><div><span className="eyebrow">YOUR TRAINING ENVIRONMENT</span><h2>Choose your next move</h2></div><span className="section-note">01 / 05 PILLARS</span></div>
      <section className="area-grid">
        {areas.map(({ title, desc, tag, to, icon: Icon }) => (
          <Link className="area-card" to={to} key={title}>
            <div className="area-card-top"><span className="area-icon"><Icon size={21} /></span><span className="area-tag">{tag}</span></div>
            <h3>{title}</h3><p>{desc}</p><span className="card-link">EXPLORE <ArrowUpRight size={14} /></span>
          </Link>
        ))}
        <Link className="area-card research-card" to="/research">
          <div className="area-card-top"><span className="area-icon"><Terminal size={21} /></span><span className="area-tag">RESEARCH</span></div>
          <h3>AI Security Research</h3><p>Explore prompt injection, agent security, model abuse and adversarial machine learning.</p><span className="card-link">EXPLORE <ArrowUpRight size={14} /></span>
        </Link>
      </section>
      <section className="learning-note">
        <div className="note-symbol">i</div><div><strong>Our learning promise</strong><p>Simple explanations are the starting point, not the finish line. Our original challenges progress from medium to expert, with optional hints and post-solve explanations.</p></div>
      </section>
    </>
  );
}
