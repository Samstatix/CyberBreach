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
const GUEST_LAB_ANSWERS: Record<string, string> = {
  "linux-auth-source": "192.0.2.44",
  "linux-listening-ports": "22,80,443",
  "linux-default-gateway": "192.0.2.1",
  "linux-current-user": "analyst",
};

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

export function isGuestLabTaskAnswerCorrect(taskId: string, answer: string): boolean {
  return Boolean(GUEST_LAB_ANSWERS[taskId]) && answer.trim().toLowerCase() === GUEST_LAB_ANSWERS[taskId];
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
    if (!isGuestLabTaskAnswerCorrect(taskId, normalized)) {
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

  for (const result of results) {
    if (result.error) throw new Error(result.error.message);
    const payload = result.data as { correct?: boolean } | null;
    if (!payload?.correct) throw new Error("A guest lab task could not be verified by the account service.");
  }

  // Import browser-only completions once. The server remains the source of truth.
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
  notifyProgressUpdated();
}
