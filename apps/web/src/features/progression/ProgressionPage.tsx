import { Activity, Award, BookOpen, CheckCircle2, Flag, LockKeyhole, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { achievementCatalog } from "./achievementCatalog";
import { skillTrees } from "./skillTrees";
import { usePlayerProgress } from "./progressionService";

export default function ProgressionPage() {
  const { user } = useAuth();
  const { progress, loading } = usePlayerProgress(user?.id);
  const completedLessons = new Set(progress.completedLessonIds);
  const solvedChallenges = new Set(progress.solvedChallengeSlugs);
  const completedMissions = new Set(progress.completedMissionIds);
  const unlockedAchievements = new Set(progress.achievements.map((achievement) => achievement.slug));

  return (
    <section className="section-page progression-page">
      <div className="eyebrow">PLAYER DEVELOPMENT / PROGRESSION</div>
      <h1>Build your operator profile.</h1>
      <p className="section-description">Every lesson, verified challenge and incident-response mission moves your skills forward. Follow your learning paths, earn achievements and grow through the ranks.</p>

      <article className="progression-hero">
        <div className="progression-identity">
          <span className="progression-rank"><ShieldCheck size={14}/> {progress.rank.toUpperCase()}</span>
          <h2>Level {progress.level}</h2>
          <p>{user ? "Your account progress is synchronized through CyberBreach." : "Guest progress is saved in this browser. Create a free account to synchronize it."}</p>
        </div>
        <div className="progression-xp-total"><strong>{progress.totalXp.toLocaleString()}</strong><span>TOTAL XP</span></div>
        <div className="progression-level-track" role="progressbar" aria-valuenow={Math.round(progress.levelProgress)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: progress.levelProgress + "%" }} />
        </div>
        <div className="progression-level-meta"><span>{progress.xpIntoLevel.toLocaleString()} / {progress.xpForNextLevel.toLocaleString()} XP in this level</span><strong>{progress.xpToNextLevel.toLocaleString()} XP to Level {progress.level + 1}</strong></div>
      </article>

      {progress.syncWarning && <p className="progression-warning" role="status">{progress.syncWarning}</p>}
      <div className="progression-stats">
        <article><BookOpen size={18}/><strong>{progress.lessonsCompleted}</strong><span>LESSONS COMPLETED</span></article>
        <article><Flag size={18}/><strong>{progress.challengesSolved}</strong><span>CHALLENGES SOLVED</span></article>
        <article><Activity size={18}/><strong>{progress.missionsCompleted}</strong><span>MISSIONS COMPLETED</span></article>
        <article><Award size={18}/><strong>{progress.achievements.length}</strong><span>ACHIEVEMENTS</span></article>
      </div>

      <div className="section-heading progression-section-heading">
        <div><span className="eyebrow">SPECIALIZATION PATHS</span><h2>Your skill trees</h2></div>
        <span className="section-note">11 LEARNING PATHS</span>
      </div>
      <div className="skill-tree-grid">
        {skillTrees.map((tree) => {
          const completedNodes = tree.nodes.filter((node) => node.kind === "lesson" ? completedLessons.has(node.reference) : node.kind === "challenge" ? solvedChallenges.has(node.reference) : completedMissions.has(node.reference)).length;
          const percent = tree.nodes.length ? Math.round((completedNodes / tree.nodes.length) * 100) : 0;
          return (
            <article className="skill-tree-card" key={tree.id}>
              <div className="skill-tree-card-head"><span>{tree.accent}</span><strong>{completedNodes}/{tree.nodes.length}</strong></div>
              <h3>{tree.title}</h3>
              <p>{tree.description}</p>
              <div className="skill-tree-track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: percent + "%" }}/></div>
              <div className="skill-tree-nodes">
                {tree.nodes.map((node) => {
                  const done = node.kind === "lesson" ? completedLessons.has(node.reference) : node.kind === "challenge" ? solvedChallenges.has(node.reference) : completedMissions.has(node.reference);
                  const destination = node.kind === "lesson" ? "/academy/lessons/" + node.reference : node.kind === "challenge" ? "/ctf/challenge/" + node.reference : "/operations";
                  return (
                    <Link className={"skill-tree-node" + (done ? " completed" : "")} to={destination} key={node.id}>
                      {done ? <CheckCircle2 size={14}/> : node.kind === "lesson" ? <BookOpen size={14}/> : node.kind === "challenge" ? <Flag size={14}/> : <Activity size={14}/>}
                      <span>{node.title}</span>
                      {done && <small>DONE</small>}
                    </Link>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <div className="section-heading progression-section-heading">
        <div><span className="eyebrow">MILESTONES</span><h2>Achievements and badges</h2></div>
        <span className="section-note">{progress.achievements.length} / {achievementCatalog.length} UNLOCKED</span>
      </div>
      <div className="achievement-grid">
        {achievementCatalog.map((achievement) => {
          const unlocked = unlockedAchievements.has(achievement.slug);
          return (
            <article className={"achievement-card" + (unlocked ? " unlocked" : "")} key={achievement.slug}>
              <div className="achievement-icon">{unlocked ? <Trophy size={20}/> : <Award size={20}/>}</div>
              <div><h3>{achievement.title}</h3><p>{achievement.description}</p><small>{unlocked ? "UNLOCKED" : achievement.requirement}</small></div>
              {unlocked ? <Sparkles size={15}/> : <LockKeyhole size={15}/>}
            </article>
          );
        })}
      </div>

      <div className="progression-footer-note">
        <Sparkles size={17}/>
        <div><strong>Progress is earned, not purchased.</strong><p>Academy XP is personal progression. Competitive leaderboard points come only from verified first-time CTF solves. Hints never reduce challenge points.</p></div>
      </div>
      {!user && <p className="progression-account-cta"><Link to="/account">Create a free account</Link> to keep your progress when you change browsers or devices.</p>}
      {loading && <span className="progression-loading">Refreshing your operator profile…</span>}
    </section>
  );
}
