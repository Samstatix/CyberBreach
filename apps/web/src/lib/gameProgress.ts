/**
 * Shared player progression model.
 * Signed-in XP comes from the append-only server ledger. Guest XP is local-only.
 */
import { supabase } from "./supabase";
import { getCompletedLessonIds } from "./academyProgress";

export type PlayerProgress = {
  xp: number; level: number; levelFloor: number; nextLevelXp: number;
  progressPercent: number; rank: string; completedLessons: number;
  solvedChallenges: number;
  achievements: Array<{ id: string; title: string; description: string; unlocked: boolean }>;
};

function levelForXp(xp: number) {
  let level = 1;
  while (xp >= level * level * 100) level += 1;
  return level;
}

export async function loadPlayerProgress(userId?: string): Promise<PlayerProgress> {
  const completedLessons = getCompletedLessonIds(userId).length;
  let xp = completedLessons * 25;
  let solvedChallenges = 0;

  if (userId && supabase) {
    const [ledger, solves, lessons] = await Promise.all([
      supabase.from("xp_ledger").select("points").eq("user_id", userId),
      supabase.from("challenge_solves").select("challenge_id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("academy_lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("user_id", userId)
    ]);
    if (!ledger.error && ledger.data) xp = ledger.data.reduce((total, row) => total + Number(row.points || 0), 0);
    if (!solves.error) solvedChallenges = solves.count ?? 0;
    // The local lesson list is merged with the server list by the Academy progress loader.
    if (!lessons.error && (lessons.count ?? 0) > completedLessons) {
      // Keep the displayed count conservative until the merged list is refreshed.
    }
  }

  const level = levelForXp(xp);
  const levelFloor = (level - 1) * (level - 1) * 100;
  const nextLevelXp = level * level * 100;
  const progressPercent = Math.min(100, Math.max(0, ((xp - levelFloor) / (nextLevelXp - levelFloor)) * 100));
  const rank = xp >= 5000 ? "ELITE OPERATIVE" : xp >= 2500 ? "SENIOR OPERATIVE" : xp >= 1000 ? "SPECIALIST" : xp >= 400 ? "FIELD ANALYST" : xp >= 100 ? "JUNIOR ANALYST" : "RECRUIT";
  const achievements = [
    { id: "first-lesson", title: "First Steps", description: "Complete your first Academy lesson.", unlocked: completedLessons >= 1 },
    { id: "five-lessons", title: "Curious Mind", description: "Complete five Academy lessons.", unlocked: completedLessons >= 5 },
    { id: "first-solve", title: "Flag Captured", description: "Solve your first CTF challenge.", unlocked: solvedChallenges >= 1 },
    { id: "five-solves", title: "Challenge Hunter", description: "Solve five CTF challenges.", unlocked: solvedChallenges >= 5 },
    { id: "level-five", title: "Rising Operative", description: "Reach level five.", unlocked: level >= 5 }
  ];
  return { xp, level, levelFloor, nextLevelXp, progressPercent, rank, completedLessons, solvedChallenges, achievements };
}
