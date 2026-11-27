import { useCallback, useEffect, useState } from "react";
import { getCompletedLessonIds } from "../../lib/academyProgress";
import { getGuestCompletedOperationIds } from "../../lib/operationsProgress";
import { getGuestCompletedLabTaskIds } from "../../lib/labTaskProgress";
import { PROGRESSION_UPDATED_EVENT } from "../../lib/progressionEvents";
import { supabase } from "../../lib/supabase";
import { achievementCatalog } from "./achievementCatalog";
import { getLevelProgress, getRankForLevel } from "./progressionMath";

export type PlayerAchievement = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
};

export type PlayerProgress = {
  totalXp: number;
  level: number;
  rank: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  levelProgress: number;
  lessonsCompleted: number;
  challengesSolved: number;
  missionsCompleted: number;
  labTasksCompleted: number;
  completedLessonIds: string[];
  solvedChallengeSlugs: string[];
  completedMissionIds: string[];
  completedLabTaskIds: string[];
  achievements: PlayerAchievement[];
  synced: boolean;
  syncWarning: string;
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function guestAchievements(lessonCount: number, missionCount: number, labTaskCount: number): PlayerAchievement[] {
  const unlocked = new Set<string>();
  if (lessonCount >= 1) unlocked.add("first-lesson");
  if (lessonCount >= 5) unlocked.add("academy-five");
  if (lessonCount >= 15) unlocked.add("academy-fifteen");
  if (missionCount >= 1) unlocked.add("first-operation");
  if (missionCount >= 3) unlocked.add("three-operations");
  if (labTaskCount >= 1) unlocked.add("first-lab");
  if (labTaskCount >= 4) unlocked.add("linux-investigator");
  return achievementCatalog
    .filter((achievement) => unlocked.has(achievement.slug))
    .map((achievement) => ({
      slug: achievement.slug,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
    }));
}

export function getGuestProgress(userId?: string): PlayerProgress {
  const completedLessonIds = getCompletedLessonIds(userId);
  const completedMissionIds = getGuestCompletedOperationIds();
  const completedLabTaskIds = getGuestCompletedLabTaskIds();
  const totalXp = completedLessonIds.length * 25 + completedMissionIds.length * 100 + completedLabTaskIds.length * 50;
  const level = getLevelProgress(totalXp);

  return {
    totalXp,
    level: level.level,
    rank: getRankForLevel(level.level),
    xpIntoLevel: level.xpIntoLevel,
    xpForNextLevel: level.xpForNextLevel,
    xpToNextLevel: level.xpToNextLevel,
    levelProgress: level.progressPercent,
    lessonsCompleted: completedLessonIds.length,
    challengesSolved: 0,
    missionsCompleted: completedMissionIds.length,
    labTasksCompleted: completedLabTaskIds.length,
    completedLessonIds,
    solvedChallengeSlugs: [],
    completedMissionIds,
    completedLabTaskIds,
    achievements: guestAchievements(completedLessonIds.length, completedMissionIds.length, completedLabTaskIds.length),
    synced: false,
    syncWarning: "",
  };
}

function normalizeServerProgress(value: unknown): PlayerProgress | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const totalXp = Number(raw.total_xp ?? 0);
  const level = getLevelProgress(totalXp);
  const achievements = Array.isArray(raw.achievements)
    ? raw.achievements.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object").map((item) => ({
        slug: String(item.slug ?? ""),
        title: String(item.title ?? ""),
        description: String(item.description ?? ""),
        icon: String(item.icon ?? "award"),
        unlockedAt: typeof item.unlocked_at === "string" ? item.unlocked_at : undefined,
      })).filter((item) => item.slug.length > 0)
    : [];

  return {
    totalXp,
    level: Number(raw.level ?? level.level),
    rank: String(raw.rank ?? getRankForLevel(level.level)),
    xpIntoLevel: Number(raw.xp_into_level ?? level.xpIntoLevel),
    xpForNextLevel: Number(raw.xp_for_next_level ?? level.xpForNextLevel),
    xpToNextLevel: Number(raw.xp_to_next_level ?? level.xpToNextLevel),
    levelProgress: Number(raw.level_progress ?? level.progressPercent),
    lessonsCompleted: Number(raw.lessons_completed ?? 0),
    challengesSolved: Number(raw.challenges_solved ?? 0),
    missionsCompleted: Number(raw.missions_completed ?? 0),
    labTasksCompleted: Number(raw.lab_tasks_completed ?? 0),
    completedLessonIds: stringArray(raw.completed_lesson_ids),
    solvedChallengeSlugs: stringArray(raw.solved_challenge_slugs),
    completedMissionIds: stringArray(raw.completed_mission_ids),
    completedLabTaskIds: stringArray(raw.completed_lab_task_ids),
    achievements,
    synced: true,
    syncWarning: "",
  };
}

export async function loadPlayerProgress(userId?: string): Promise<PlayerProgress> {
  if (!userId || !supabase) return getGuestProgress(userId);

  try {
    const { data, error } = await supabase.rpc("get_player_progress");
    if (!error) {
      const snapshot = normalizeServerProgress(data);
      if (snapshot) return snapshot;
    }
    const fallback = getGuestProgress(userId);
    return {
      ...fallback,
      syncWarning: error?.message || "The progression service returned an unexpected response.",
    };
  } catch {
    return {
      ...getGuestProgress(userId),
      syncWarning: "Progress could not be synchronized. Your locally cached lessons are still available.",
    };
  }
}

export function usePlayerProgress(userId?: string) {
  const [progress, setProgress] = useState<PlayerProgress>(() => getGuestProgress(userId));
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await loadPlayerProgress(userId);
    setProgress(next);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    let active = true;

    async function load() {
      const next = await loadPlayerProgress(userId);
      if (active) {
        setProgress(next);
        setLoading(false);
      }
    }

    function handleProgressUpdate() {
      void load();
    }

    setLoading(true);
    window.addEventListener(PROGRESSION_UPDATED_EVENT, handleProgressUpdate);
    void load();

    return () => {
      active = false;
      window.removeEventListener(PROGRESSION_UPDATED_EVENT, handleProgressUpdate);
    };
  }, [userId]);

  return { progress, loading, refresh };
}
