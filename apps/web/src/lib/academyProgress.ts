/**
 * Guest progress is local to this browser. Signed-in lesson completions are
 * verified and recorded by the Supabase RPC before they are shown as synced.
 */
import { notifyProgressUpdated } from "./progressionEvents";
import { supabase } from "./supabase";

const STORAGE_PREFIX = "cyberbreach.academy.completed.v1";
function storageKey(userId?: string) {
  return STORAGE_PREFIX + "." + (userId || "guest");
}

export function getCompletedLessonIds(userId?: string): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string"))] : [];
  } catch {
    return [];
  }
}

export async function loadCompletedLessonIds(userId?: string): Promise<string[]> {
  const accountLocal = getCompletedLessonIds(userId);
  const guestLocal = userId ? getCompletedLessonIds() : [];
  const local = [...new Set([...accountLocal, ...guestLocal])];
  if (!userId || !supabase) return local;

  const client = supabase;
  const { data, error } = await client
    .from("academy_lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId);

  // If the API is unavailable, preserve the cached view but do not delete the
  // guest queue. A later visit can retry the account synchronization.
  if (error || !data) return local;

  const remoteIds = data.map((row) => row.lesson_id);
  const missingLocalIds = local.filter((lessonId) => !remoteIds.includes(lessonId));

  if (missingLocalIds.length > 0) {
    const results = await Promise.all(missingLocalIds.map((lessonId) =>
      client.rpc("complete_academy_lesson", { p_lesson_id: lessonId }),
    ));
    if (results.some((result) => result.error)) {
      // Continue with the refreshed server state; rejected or obsolete IDs
      // must not be displayed as completed merely because they were cached.
    }
  }

  const refreshed = await client
    .from("academy_lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId);

  if (refreshed.error || !refreshed.data) return remoteIds;

  const verifiedIds = [...new Set(refreshed.data.map((row) => row.lesson_id))];
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(verifiedIds));
    if (guestLocal.every((lessonId) => verifiedIds.includes(lessonId))) {
      window.localStorage.removeItem(storageKey());
    }
  } catch {
    // Database progress remains available even when browser storage is blocked.
  }

  if (missingLocalIds.length > 0) notifyProgressUpdated();
  return verifiedIds;
}

export type LessonCompletionResult = {
  completedIds: string[];
  xpAwarded: number;
  alreadyCompleted: boolean;
  synced: boolean;
};

export async function markLessonComplete(lessonId: string, userId?: string): Promise<LessonCompletionResult> {
  if (userId && supabase) {
    const { data, error } = await supabase.rpc("complete_academy_lesson", { p_lesson_id: lessonId });
    if (error) throw new Error(error.message);
    const result = data as { completed?: boolean; xp_awarded?: number } | null;
    if (!result?.completed) throw new Error("The Academy service did not confirm this lesson completion.");

    const completedIds = [...new Set([...getCompletedLessonIds(userId), lessonId])];
    try { window.localStorage.setItem(storageKey(userId), JSON.stringify(completedIds)); } catch { /* Server state is authoritative. */ }
    notifyProgressUpdated();
    return {
      completedIds,
      xpAwarded: Number(result.xp_awarded ?? 0),
      alreadyCompleted: Number(result.xp_awarded ?? 0) === 0,
      synced: true,
    };
  }

  const previousIds = getCompletedLessonIds(userId);
  const alreadyCompleted = previousIds.includes(lessonId);
  const completedIds = [...new Set([...previousIds, lessonId])];
  try { window.localStorage.setItem(storageKey(userId), JSON.stringify(completedIds)); } catch { /* Session remains usable. */ }
  notifyProgressUpdated();
  return {
    completedIds,
    xpAwarded: alreadyCompleted ? 0 : 25,
    alreadyCompleted,
    synced: false,
  };
}
