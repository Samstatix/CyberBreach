import { supabase } from "../../lib/supabase";

export type FlagSubmission = {
  correct: boolean;
  already_solved: boolean;
  points_awarded: number;
  message: string;
};

export type ChallengeSolution = {
  walkthrough_md: string;
  defensive_notes_md: string;
  reflection_question: string;
};

function firstRow<T>(data: T[] | T | null): T | null {
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}

export async function submitChallengeFlag(challengeId: string, flag: string): Promise<FlagSubmission> {
  if (!supabase) throw new Error("Challenge scoring is not configured yet. Please try again later.");
  const { data, error } = await supabase.rpc("submit_challenge_flag", {
    p_challenge_id: challengeId,
    p_flag: flag.trim(),
  });
  if (error) throw new Error(error.message);
  const result = firstRow(data as FlagSubmission[] | FlagSubmission | null);
  if (!result) throw new Error("The scoring service returned an empty response.");
  return result;
}

export async function getChallengeSolution(challengeId: string): Promise<ChallengeSolution> {
  if (!supabase) throw new Error("Challenge solutions are not available until the platform is configured.");
  const { data, error } = await supabase.rpc("get_challenge_solution", { p_challenge_id: challengeId });
  if (error) throw new Error(error.message);
  const solution = firstRow(data as ChallengeSolution[] | ChallengeSolution | null);
  if (!solution) throw new Error("No walkthrough is available for this challenge.");
  return solution;
}
