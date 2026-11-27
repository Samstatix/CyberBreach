#!/usr/bin/env node
/**
 * Guardrail: private answer material must never be committed to public source.
 * This is a source-tree check, not a substitute for Git-history secret scanning.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { findPrivateContentViolations } from "./security-scan-rules.mjs";

// Scan database migrations, verification SQL, server functions and browser
// source. The private-content loader is checked explicitly; example JSON is
// intentionally excluded because it contains placeholders, not real answers.
const roots = [
  "supabase/migrations",
  "supabase/verification",
  "supabase/functions",
  "apps/web/src",
];
const explicitFiles = ["supabase/seed.sql", "scripts/load-private-content.mjs"];
const extensions = new Set([".sql", ".ts", ".tsx", ".js", ".mjs"]);

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
  for (const finding of findPrivateContentViolations(content)) {
    findings.push(path + ":" + finding.line + " — " + finding.label);
  }
}

if (findings.length) {
  console.error("Public-source security scan failed:");
  for (const finding of findings) console.error(" - " + finding);
  process.exitCode = 1;
} else {
  console.log("Public-source security scan passed. No private answer material found in scanned source files.");
}
