import { MonitorPlay, Server, ShieldCheck, Clock3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function LabsPage() {
  return (
    <section className="section-page">
      <div className="eyebrow">PRACTICE / CYBER LABS</div>
      <h1>Practice safely. Learn by doing.</h1>
      <p className="section-description">CyberBreach will offer two kinds of practical environment. The page labels them clearly so learners always know whether they are using a simulation or a real isolated system.</p>
      <div className="lab-mode-grid">
        <article className="lab-mode-card">
          <div className="lab-mode-icon"><MonitorPlay size={24}/></div>
          <span className="area-tag">MODE 01 / BROWSER</span>
          <h2>Interactive simulations</h2>
          <p>Practice concepts directly in the browser. These exercises are designed to be quick to start and safe for introductory learning.</p>
          <ul><li>Command-line learning simulator</li><li>Log and packet inspection exercises</li><li>Guided web request demonstrations</li><li>Incident-response scenarios</li></ul>
          <div className="lab-mode-status">SIMULATION · NO REAL HOST ACCESS</div>
          <Link className="lab-launch-link" to="/labs/linux-terminal">OPEN LINUX SIMULATOR <ArrowRight size={14}/></Link>
        </article>
        <article className="lab-mode-card">
          <div className="lab-mode-icon"><Server size={24}/></div>
          <span className="area-tag">MODE 02 / ISOLATED SYSTEM</span>
          <h2>Real disposable labs</h2>
          <p>For advanced exercises that need actual tools, operating systems or vulnerable services, a temporary isolated environment will be provisioned.</p>
          <ul><li>Disposable Linux environments</li><li>Intentionally vulnerable web applications</li><li>Network and forensic tool exercises</li><li>Resettable, time-limited sessions</li></ul>
          <div className="lab-mode-status planned"><Clock3 size={13}/> PLANNED · NOT YET AVAILABLE</div>
        </article>
      </div>
      <div className="learning-note"><div className="note-symbol"><ShieldCheck size={14}/></div><div><strong>Safety comes first</strong><p>Real labs will be isolated from production systems, have resource and time limits, restrict network access and be destroyed after use. No real third-party targets are part of the training environment.</p></div></div>
      <div className="coming-panel"><ShieldCheck size={22}/><div><strong>Lab infrastructure is not active yet</strong><p>This page describes the planned two-mode lab model. We will not enable public execution of untrusted code until isolation, monitoring, cleanup and abuse controls have been tested.</p></div></div>
    </section>
  );
}
