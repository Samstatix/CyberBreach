export const PROGRESSION_UPDATED_EVENT = "cyberbreach:progress-updated";

export function notifyProgressUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROGRESSION_UPDATED_EVENT));
  }
}
