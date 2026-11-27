#!/usr/bin/env node
/**
 * Load CyberBreach answer material from an ignored, administrator-owned file.
 *
 * Required environment:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * Optional:
 *   CYBERBREACH_PRIVATE_CONTENT_FILE (defaults to supabase/private-content.json)
 *
 * Never place the service-role key in a VITE_ variable or browser environment.
 * This script intentionally never prints answer values or private walkthroughs.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const privateFile = resolve(
  process.env.CYBERBREACH_PRIVATE_CONTENT_FILE || "supabase/private-content.json",
);

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the local admin shell.");
}

const source = JSON.parse(await readFile(privateFile, "utf8"));

function requireText(value, label, maxBytes = 10000) {
  if (typeof value !== "string" || !value.trim() || /replace[_ -]?me|placeholder|todo/i.test(value)) {
    throw new Error(label + " is missing or still contains a placeholder.");
  }
  if (Buffer.byteLength(value.trim(), "utf8") > maxBytes) {
    throw new Error(label + " exceeds its maximum length.");
  }
  return value.trim();
}

function requireArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(label + " must be a non-empty array.");
  }
  return value;
}

function assertExactIds(actual, supplied, label) {
  const expected = new Set(actual);
  const received = new Set(supplied);
  if (received.size !== supplied.length) {
    throw new Error(label + " contains duplicate identifiers.");
  }
  const missing = [...expected].filter((id) => !received.has(id));
  const unknown = [...received].filter((id) => !expected.has(id));
  if (missing.length || unknown.length) {
    throw new Error(
      label + " mismatch. Missing: " + (missing.join(", ") || "none") +
      ". Unknown: " + (unknown.join(", ") || "none") + ".",
    );
  }
}

async function api(path, options = {}) {
  const method = options.method || "GET";
  const headers = {
    apikey: serviceRoleKey,
    Authorization: "Bearer " + serviceRoleKey,
    Accept: "application/json",
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.prefer) headers.Prefer = options.prefer;

  const response = await fetch(supabaseUrl + "/rest/v1/" + path, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error("Supabase " + method + " " + path + " failed (" + response.status + "): " + text.slice(0, 500));
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const challenges = requireArray(source.challenges, "challenges");
const operations = requireArray(source.operationsMissions, "operationsMissions");
const labs = requireArray(source.labTasks, "labTasks");

const [publishedChallenges, activeMissions, activeLabs] = await Promise.all([
  api("challenges?select=id,slug&status=eq.published"),
  api("operations_mission_catalog?select=mission_id&is_active=eq.true"),
  api("lab_task_catalog?select=task_id&is_active=eq.true"),
]);

assertExactIds(
  publishedChallenges.map((item) => item.slug),
  challenges.map((item) => requireText(item.slug, "challenge slug", 100)),
  "Published challenge content",
);
assertExactIds(
  activeMissions.map((item) => item.mission_id),
  operations.map((item) => requireText(item.missionId, "mission id", 100)),
  "Operations answer content",
);
assertExactIds(
  activeLabs.map((item) => item.task_id),
  labs.map((item) => requireText(item.taskId, "lab task id", 100)),
  "Lab answer content",
);

for (const entry of challenges) {
  const slug = requireText(entry.slug, "challenge slug", 100);
  const releaseVersion = Number(entry.releaseVersion);
  if (!Number.isInteger(releaseVersion) || releaseVersion < 2) {
    throw new Error("Challenge " + slug + " must use releaseVersion 2 or higher to replace exposed keys.");
  }
  const flag = requireText(entry.flag, "flag for " + slug, 256);
  if (Buffer.byteLength(flag, "utf8") < 24) {
    throw new Error("Flag for " + slug + " must be at least 24 bytes; use a fresh high-entropy flag.");
  }
  const walkthroughMd = requireText(entry.walkthroughMd, "walkthrough for " + slug, 20000);
  const defensiveNotesMd = requireText(entry.defensiveNotesMd, "defensive notes for " + slug, 20000);
  const reflectionQuestion = requireText(entry.reflectionQuestion, "reflection question for " + slug, 1000);
  const challenge = publishedChallenges.find((item) => item.slug === slug);
  const flagHash = createHash("sha256").update(flag, "utf8").digest("hex");

  await api(
    "challenge_secrets?challenge_id=eq." + encodeURIComponent(challenge.id) + "&is_active=eq.true",
    { method: "PATCH", body: { is_active: false } },
  );
  await api("challenge_secrets?on_conflict=challenge_id,release_version", {
    method: "POST",
    body: [{
      challenge_id: challenge.id,
      release_version: releaseVersion,
      flag_hash: flagHash,
      is_active: true,
    }],
    prefer: "resolution=merge-duplicates,return=minimal",
  });
  await api("challenge_solutions?on_conflict=challenge_id", {
    method: "POST",
    body: [{
      challenge_id: challenge.id,
      walkthrough_md: walkthroughMd,
      defensive_notes_md: defensiveNotesMd,
      reflection_question: reflectionQuestion,
    }],
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

for (const entry of operations) {
  const missionId = requireText(entry.missionId, "mission id", 100);
  const answerId = requireText(entry.correctOptionId, "correct option for " + missionId, 72);
  await api("rpc/set_private_operation_answer", {
    method: "POST",
    body: { p_mission_id: missionId, p_answer_id: answerId },
  });
}

for (const entry of labs) {
  const taskId = requireText(entry.taskId, "lab task id", 100);
  const answer = requireText(entry.answer, "answer for " + taskId, 72);
  if (Buffer.byteLength(answer, "utf8") > 72) {
    throw new Error("Answer for " + taskId + " exceeds bcrypt's 72-byte input limit.");
  }
  await api("rpc/set_private_lab_task_answer", {
    method: "POST",
    body: { p_task_id: taskId, p_answer: answer },
  });
}

console.log(
  "Private content loaded successfully: " + challenges.length + " CTF challenges, " +
  operations.length + " Operations missions and " + labs.length + " browser-lab tasks.",
);
