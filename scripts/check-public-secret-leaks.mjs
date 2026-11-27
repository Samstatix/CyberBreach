#!/usr/bin/env node
/**
 * Guardrail: private answer material must never be committed to public source.
 * This is a source-tree check, not a substitute for Git-history secret scanning.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = ["supabase/migrations", "apps/web/src"];
const explicitFiles = ["supabase/seed.sql"];
const extensions = new Set([".sql", ".ts", ".tsx", ".js", ".mjs"]);
const forbidden = [
  ["challenge secret seed", /insert\s+into\s+public\.challenge_secrets\b/i],
  ["challenge walkthrough seed", /insert\s+into\s+public\.challenge_solutions\b/i],
  ["plaintext operations answer", /correct_option_id\s*[,=]\s*'[^']+'/i],
  ["literal SHA-256 lab answer", /answer_hash\s*[,=]\s*'[0-9a-f]{64}'/i],
  ["literal SHA-256 CTF flag", /flag_hash\s*[,=]\s*'[0-9a-f]{64}'/i],
  ["inline walkthrough content", /walkthrough_md\s*[,=]\s*'/i],
  ["inline defensive solution content", /defensive_notes_md\s*[,=]\s*'/i],
];

async function collectFiles(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(path, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", "dist", "coverage"].includes(entry.name)) {
        files.push(...await collectFiles(fullPath));
      }
    } else {
      const extension = entry.name.slice(entry.name.lastIndexOf("."));
      if (extensions.has(extension)) files.push(fullPath);
    }
  }
  return files;
}

const files = [...explicitFiles];
for (const root of roots) files.push(...await collectFiles(root));

const findings = [];
for (const path of files) {
  const content = await readFile(path, "utf8");
  for (const [label, pattern] of forbidden) {
    const match = pattern.exec(content);
    if (match) {
      const line = content.slice(0, match.index).split("\n").length;
      findings.push(path + ":" + line + " — " + label);
    }
  }
}

if (findings.length) {
  console.error("Public-source security scan failed:");
  for (const finding of findings) console.error(" - " + finding);
  process.exitCode = 1;
} else {
  console.log("Public-source security scan passed. No private answer material found in scanned source files.");
}
