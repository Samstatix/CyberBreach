import { Link, NavLink, Outlet } from "react-router-dom";
import { Award, BookOpen, BrainCircuit, Flag, FlaskConical, LayoutDashboard, Menu, Shield, Trophy, Users, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../features/auth/AuthProvider";
import { usePlayerProgress } from "../../features/progression/progressionService";
import CyroAssistant from "../cyro/CyroAssistant";

const links = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/academy", label: "Cyber Academy", icon: BookOpen },
  { to: "/ctf", label: "CTF Arena", icon: Flag },
  { to: "/labs", label: "Cyber Labs", icon: FlaskConical },
  { to: "/progression", label: "Progression", icon: Award },
  { to: "/community", label: "Community", icon: Users },
  { to: "/research", label: "AI Security Research", icon: BrainCircuit },
];

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const { progress } = usePlayerProgress(user?.id);

  return (
    <div className="app-shell">
      <aside className={"sidebar " + (open ? "sidebar-open" : "")}>
        <div className="brand">
          <div className="brand-mark"><Shield size={21} /></div>
          <div><strong>CYBERBREACH</strong><span>BY COLLABCIRCLE</span></div>
        </div>
        <div className="nav-caption">TRAINING ENVIRONMENT</div>
        <nav className="navigation" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot"><span className="online-dot" /> SYSTEM ONLINE <small>PLATFORM BUILD 0.4</small></div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><Menu size={20} /></button>
          <div className="breadcrumb"><span>COLLABCIRCLE</span><b>/</b> CYBERSECURITY DEPARTMENT</div>
          <div className="topbar-actions">
            <Link className="player-progress-link" to="/progression" aria-label={"Level " + progress.level + ", " + progress.rank + ", " + progress.totalXp + " XP"}>
              <span className="player-level-mark">LV {progress.level}</span>
              <span className="player-progress-copy"><strong>{progress.rank}</strong><small>{progress.totalXp.toLocaleString()} XP</small></span>
              <Trophy size={15}/>
            </Link>
            <div className="topbar-status"><span className="online-dot" /> DEVELOPMENT ENVIRONMENT</div>
            <Link className="account-link" to="/account"><UserRound size={15}/><span>{loading ? "CHECKING…" : user ? "MY ACCOUNT" : "SIGN IN"}</span></Link>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
        <footer className="site-footer">CYBERBREACH <span>·</span> LEARN WITH PURPOSE. PRACTICE WITH PERMISSION.</footer>
        <CyroAssistant />
      </div>
    </div>
  );
}
