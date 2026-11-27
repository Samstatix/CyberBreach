/**
 * Guest progress is local to this browser. Signed-in lesson completions are
 * recorded by a trusted Supabase function so XP cannot be written by the client.
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
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function loadCompletedLessonIds(userId?: string): Promise<string[]> {
  const accountLocal = getCompletedLessonIds(userId);
  const local = userId ? [...new Set([...accountLocal, ...getCompletedLessonIds()])] : accountLocal;
  if (!userId || !supabase) return local;

  const { data, error } = await supabase
    .from("academy_lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId);

  if (error || !data) return local;

  const remoteIds = data.map((row) => row.lesson_id);
  const missingLocalIds = local.filter((lessonId) => !remoteIds.includes(lessonId));

  // Migrate previously cached completions through the allow-listed RPC. Unknown
  // or obsolete IDs are rejected by the database and do not receive XP.
  if (missingLocalIds.length > 0) {
    await Promise.all(missingLocalIds.map((lessonId) =>
      supabase.rpc("complete_academy_lesson", { p_lesson_id: lessonId }),
    ));
    notifyProgressUpdated();
  }

  const refreshed = await supabase
    .from("academy_lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId);

  const finalRemoteIds = refreshed.data ? refreshed.data.map((row) => row.lesson_id) : remoteIds;
  const merged = [...new Set([...local, ...finalRemoteIds])];

  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(merged));
  } catch {
    // Database progress remains available even when browser storage is blocked.
  }

  return merged;
}

export function markLessonComplete(lessonId: string, userId?: string): string[] {
  const completed = new Set(getCompletedLessonIds(userId));
  completed.add(lessonId);
  const next = [...completed];

  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // The current page still updates when browser storage is unavailable.
  }

  if (userId && supabase) {
    void supabase.rpc("complete_academy_lesson", { p_lesson_id: lessonId }).then(({ error }) => {
      if (error) console.error("Academy progress sync failed:", error.message);
      notifyProgressUpdated();
    });
  } else {
    notifyProgressUpdated();
  }

  return next;
}
