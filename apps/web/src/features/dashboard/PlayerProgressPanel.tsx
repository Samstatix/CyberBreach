import { useEffect, useState } from "react";
import { Award, BookOpen, Flag, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { loadPlayerProgress, type PlayerProgress } from "../../lib/gameProgress";

const emptyProgress: PlayerProgress = {
  xp: 0, level: 1, levelFloor: 0, nextLevelXp: 100, progressPercent: 0,
  rank: "RECRUIT", completedLessons: 0, solvedChallenges: 0, achievements: []
};

export default function PlayerProgressPanel() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<PlayerProgress>(emptyProgress);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    void loadPlayerProgress(user?.id).then((value) => {
      if (active) setProgress(value);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);
  const unlocked = progress.achievements.filter((item) => item.unlocked);
  return (
    <section className="player-progression" aria-labelledby="player-progression-title">
      <div className="progression-heading">
        <div><span className="eyebrow">YOUR OPERATIVE PROFILE</span><h2 id="player-progression-title">Progress & achievements</h2></div>
        <span className="progression-rank"><ShieldCheck size={14}/>{progress.rank}</span>
      </div>
      <div className="progression-overview">
        <div className="level-emblem"><span>LEVEL</span><strong>{progress.level}</strong><small>OPERATIVE</small></div>
        <div className="level-details">
          <div className="level-xp"><strong>{progress.xp.toLocaleString()} XP</strong><span>{loading ? "SYNCING…" : `${Math.max(0, progress.nextLevelXp - progress.xp)} XP TO NEXT LEVEL`}</span></div>
          <div className="xp-track" role="progressbar" aria-label="Progress to next level" aria-valuenow={Math.round(progress.progressPercent)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress.progressPercent}%` }}/></div>
          <div className="progression-stats">
            <div><BookOpen size={15}/><strong>{progress.completedLessons}</strong><span>LESSONS</span></div>
            <div><Flag size={15}/><strong>{progress.solvedChallenges}</strong><span>CHALLENGES</span></div>
            <div><Award size={15}/><strong>{unlocked.length}</strong><span>BADGES</span></div>
          </div>
        </div>
      </div>
      <div className="achievement-heading"><Sparkles size={15}/><strong>ACHIEVEMENT COLLECTION</strong><span>{unlocked.length}/{progress.achievements.length} UNLOCKED</span></div>
      <div className="achievement-grid">
        {progress.achievements.map((achievement) => (
          <article className={`achievement-card ${achievement.unlocked ? "unlocked" : "locked"}`} key={achievement.id}>
            <span className="achievement-icon"><Award size={17}/></span>
            <div><strong>{achievement.title}</strong><p>{achievement.description}</p></div>
            <small>{achievement.unlocked ? "UNLOCKED" : "LOCKED"}</small>
          </article>
        ))}
      </div>
      {!user && <p className="progression-note">Guest progress is stored in this browser. Sign in to sync learning progress and earn server-recorded challenge XP.</p>}
    </section>
  );
}
