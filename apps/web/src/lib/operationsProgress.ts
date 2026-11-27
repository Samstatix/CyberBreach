import { notifyProgressUpdated } from "./progressionEvents";
import { supabase } from "./supabase";

export type OperationMissionRecord = {
  missionId: string;
  answerId: string;
};

export type OperationMissionResult = {
  correct: boolean;
  completed: boolean;
  already_completed: boolean;
  xp_awarded: number;
  message: string;
};

const STORAGE_KEY = "cyberbreach.operations.completed.v1.guest";

export function getGuestOperationRecords(): OperationMissionRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is OperationMissionRecord =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as OperationMissionRecord).missionId === "string" &&
      typeof (item as OperationMissionRecord).answerId === "string",
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
  const exists = records.some((item) => item.missionId === record.missionId);
  if (exists) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...records, record]));
  } catch {
    // The current page still reports the completed practice attempt.
  }
  return true;
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
    const awarded = saveGuestOperationRecord({ missionId, answerId });
    notifyProgressUpdated();
    return {
      correct: true,
      completed: true,
      already_completed: !awarded,
      xp_awarded: awarded ? 100 : 0,
      message: awarded ? "Mission completed. 100 XP earned in guest mode." : "Mission already completed.",
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
  if (!userId) return;
  const client = supabase;
  if (!client) return;
  const records = getGuestOperationRecords();
  if (records.length === 0) return;

  const results = await Promise.all(records.map((record) =>
    client.rpc("complete_operations_mission", {
      p_mission_id: record.missionId,
      p_answer_id: record.answerId,
    }),
  ));

  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
  notifyProgressUpdated();
}
