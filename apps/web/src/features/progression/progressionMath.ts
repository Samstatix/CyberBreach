export type LevelProgress = {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
};

export function getLevelProgress(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(totalXp) ? totalXp : 0));
  let level = 1;
  let currentLevelXp = 0;
  let nextLevelXp = 250;

  while (safeXp >= nextLevelXp) {
    level += 1;
    currentLevelXp = nextLevelXp;
    nextLevelXp = 250 * level * (level + 1) / 2;
  }

  const xpIntoLevel = safeXp - currentLevelXp;
  const xpForNextLevel = nextLevelXp - currentLevelXp;

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpForNextLevel,
    xpToNextLevel: Math.max(0, nextLevelXp - safeXp),
    progressPercent: Math.min(100, Math.max(0, (xpIntoLevel / xpForNextLevel) * 100)),
  };
}

export function getRankForLevel(level: number): string {
  if (level >= 20) return "Elite";
  if (level >= 15) return "Senior Operator";
  if (level >= 10) return "Operator";
  if (level >= 7) return "Specialist";
  if (level >= 4) return "Analyst";
  if (level >= 2) return "Trainee";
  return "Recruit";
}
