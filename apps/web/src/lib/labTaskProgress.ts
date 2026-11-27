import { notifyProgressUpdated } from "./progressionEvents";
import { supabase } from "./supabase";

type GuestLabTaskRecord = { taskId: string; answer: string };

export type LabTaskResult = {
  correct: boolean;
  completed: boolean;
  already_completed: boolean;
  xp_awarded: number;
  message: string;
};

const STORAGE_KEY = "cyberbreach.lab-tasks.completed.v1.guest";

function getGuestLabTaskRecords(): GuestLabTaskRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is GuestLabTaskRecord =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as GuestLabTaskRecord).taskId === "string" &&
      typeof (item as GuestLabTaskRecord).answer === "string",
    );
  } catch {
    return [];
  }
}

export function getGuestCompletedLabTaskIds(): string[] {
  return [...new Set(getGuestLabTaskRecords().map((record) => record.taskId))];
}

function saveGuestLabTask(taskId: string, answer: string): boolean {
  const records = getGuestLabTaskRecords();
  if (records.some((record) => record.taskId === taskId)) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...records, { taskId, answer }]));
  } catch {
    // The current session can still display the result if storage is blocked.
  }
  return true;
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
  if (!userId || !supabase) {
    const normalized = answer.trim().toLowerCase();
    if (taskId !== "linux-auth-source" || normalized !== "192.0.2.44") {
      return {
        correct: false,
        completed: false,
        already_completed: false,
        xp_awarded: 0,
        message: "That finding does not match the evidence. Compare the failed login entries and try again.",
      };
    }

    const awarded = saveGuestLabTask(taskId, normalized);
    notifyProgressUpdated();
    return {
      correct: true,
      completed: true,
      already_completed: !awarded,
      xp_awarded: awarded ? 50 : 0,
      message: awarded ? "Investigation complete. 50 XP earned in guest mode." : "Lab task already completed.",
    };
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

export async function syncGuestLabTasks(userId?: string): Promise<void> {
  if (!userId) return;
  const client = supabase;
  if (!client) return;
  const records = getGuestLabTaskRecords();
  if (records.length === 0) return;

  const results = await Promise.all(records.map((record) =>
    client.rpc("complete_lab_task", {
      p_task_id: record.taskId,
      p_answer: record.answer,
    }),
  ));

  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
  notifyProgressUpdated();
}
