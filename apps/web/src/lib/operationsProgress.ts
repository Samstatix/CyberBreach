import { notifyProgressUpdated } from "./progressionEvents";
import { supabase } from "./supabase";

export type OperationMissionResult = {
  correct: boolean;
  completed: boolean;
  already_completed: boolean;
  xp_awarded: number;
  message: string;
};

const LEGACY_GUEST_STORAGE_KEY = "cyberbreach.operations.completed.v1.guest";

/**
 * Guest-side answer keys were removed: answer verification and XP must be
 * server-authoritative. Guest users can read the scenarios but must sign in
 * before submitting an answer.
 */
export function getGuestCompletedOperationIds(): string[] {
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

export async function completeOperationsMission(
  missionId: string,
  answerId: string,
  userId?: string,
): Promise<OperationMissionResult> {
  if (!userId) {
    throw new Error("Sign in to verify your response and save mission progress.");
  }
  if (!supabase) {
    throw new Error("Mission verification is not configured. Please try again later.");
  }

  const { data, error } = await supabase.rpc("complete_operations_mission", {
    p_mission_id: missionId,
    p_answer_id: answerId,
  });
  if (error) throw new Error(error.message);
  const result = firstRow(data as OperationMissionResult[] | OperationMissionResult | null);
  if (!result) throw new Error("The mission service returned an empty response.");
  if (result.correct) notifyProgressUpdated();
  return result;
}

export async function syncGuestOperationProgress(_userId?: string): Promise<void> {
  clearLegacyGuestRecords();
}
