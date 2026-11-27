import { notifyProgressUpdated } from "./progressionEvents";
import { supabase } from "./supabase";

export type OperationMissionRecord = { missionId: string; answerId: string };
export type OperationMissionResult = {
  correct: boolean; completed: boolean; already_completed: boolean;
  xp_awarded: number; message: string;
};

const STORAGE_KEY = "cyberbreach.operations.completed.v1.guest";
const GUEST_MISSION_ANSWERS: Record<string, string> = {
  "auth-burst": "preserve-contain-verify",
  "dns-burst": "preserve-isolate",
  "priv-change": "preserve-verify-revoke",
};

/** Keep guest-mode practice validation consistent with the visible scenario choices. */
export function isGuestOperationsAnswerCorrect(missionId: string, answerId: string): boolean {
  return GUEST_MISSION_ANSWERS[missionId] === answerId;
}

export function getGuestOperationRecords(): OperationMissionRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is OperationMissionRecord =>
      Boolean(item) && typeof item === "object" &&
      typeof (item as OperationMissionRecord).missionId === "string" &&
      typeof (item as OperationMissionRecord).answerId === "string" &&
      isGuestOperationsAnswerCorrect((item as OperationMissionRecord).missionId, (item as OperationMissionRecord).answerId),
    );
  } catch {
    return [];
  }
}

export function getGuestCompletedOperationIds(): string[] {
  return [...new Set(getGuestOperationRecords().map((record) => record.missionId))];
}

function saveGuestOperationRecord(record: OperationMissionRecord): boolean {
  const records = getGuestOperationRecords();
  if (records.some((item) => item.missionId === record.missionId)) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...records, record]));
    return true;
  } catch {
    // Guest progress is browser-only. A blocked storage area cannot persist it.
    return false;
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
  if (!userId || !supabase) {
    if (!isGuestOperationsAnswerCorrect(missionId, answerId)) {
      return {
        correct: false, completed: false, already_completed: false, xp_awarded: 0,
        message: "That response does not match the evidence. Review the incident and try again.",
      };
    }
    const awarded = saveGuestOperationRecord({ missionId, answerId });
    notifyProgressUpdated();
    return {
      correct: true, completed: true, already_completed: !awarded,
      xp_awarded: awarded ? 100 : 0,
      message: awarded
        ? "Mission completed. 100 XP earned in guest mode."
        : getGuestOperationRecords().some((record) => record.missionId === missionId)
          ? "Mission already completed."
          : "Correct response, but browser storage is unavailable. Sign in to save progress.",
    };
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

export async function syncGuestOperationProgress(userId?: string): Promise<void> {
  if (!userId || !supabase) return;
  const records = getGuestOperationRecords();
  if (records.length === 0) return;

  const results = await Promise.all(records.map((record) =>
    supabase!.rpc("complete_operations_mission", {
      p_mission_id: record.missionId,
      p_answer_id: record.answerId,
    }),
  ));

  for (const result of results) {
    if (result.error) throw new Error(result.error.message);
    const payload = result.data as { correct?: boolean } | null;
    if (!payload?.correct) throw new Error("A guest mission could not be verified by the account service.");
  }

  // A guest completion may be imported into one account only. Removing the
  // local queue after server confirmation prevents replay into another account.
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
  notifyProgressUpdated();
}
