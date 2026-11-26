/**
 * Local progress adapter for the unauthenticated prototype.
 *
 * This is intentionally a convenience feature, not an authoritative record.
 * Once accounts and the API are enabled, progress will be synchronized through
 * the authenticated backend instead of trusting browser storage.
 */
const STORAGE_KEY = "cyberbreach.academy.completed.v1";

export function getCompletedLessonIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    // Private browsing or disabled storage must not prevent lessons from opening.
    return [];
  }
}

export function markLessonComplete(lessonId: string): string[] {
  const completed = new Set(getCompletedLessonIds());
  completed.add(lessonId);
  const next = [...completed];

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Progress remains available for the current page session even if storage fails.
  }

  return next;
}
