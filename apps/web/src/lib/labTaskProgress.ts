import { notifyProgressUpdated } from "./progressionEvents";
import { supabase } from "./supabase";

export type LabTaskResult = {
  correct: boolean;
  completed: boolean;
  already_completed: boolean;
  xp_awarded: number;
  message: string;
};

const LEGACY_GUEST_STORAGE_KEY = "cyberbreach.lab-tasks.completed.v1.guest";

/**
 * Guest-side lab answer keys were removed. The browser can display the
 * synthetic evidence, but only the trusted database can verify an answer.
 */
export function getGuestCompletedLabTaskIds(): string[] {
  return [];
}

function clearLegacyGuestRecords() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_GUEST_STORAGE_KEY);
  } catch {
    // Browser storage may be unavailable; no local answer data is imported.
  }
}

function firstRow<T>(data: T[] | T | null): T | null {
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}

export async function completeLabTask(
  taskId: string,
  answer: string,
  userId?: string,
): Promise<LabTaskResult> {
  if (!userId) {
    throw new Error("Sign in to verify your finding and save lab progress.");
  }
  if (!supabase) {
    throw new Error("Lab verification is not configured. Please try again later.");
  }

  const { data, error } = await supabase.rpc("complete_lab_task", {
    p_task_id: taskId,
    p_answer: answer,
  });
  if (error) throw new Error(error.message);
  const result = firstRow(data as LabTaskResult[] | LabTaskResult | null);
  if (!result) throw new Error("The lab task service returned an empty response.");
  if (result.correct) notifyProgressUpdated();
  return result;
}

export async function syncGuestLabTasks(_userId?: string): Promise<void> {
  clearLegacyGuestRecords();
}
