#!/usr/bin/env node
/**
 * Generate the SHA-256 digest expected by the private challenge_secrets table.
 *
 * Usage:
 *   printf '%s' 'CB{a-long-random-value}' | node scripts/hash-flag.mjs
 *
 * The script reads the flag from stdin and prints only the digest. It does not
 * echo the submitted value, write it to disk or add it to a SQL file.
 * Use a randomly generated flag with high entropy; do not use a guessable phrase.
 */
import { createHash } from "node:crypto";

let input = "";

for await (const chunk of process.stdin) {
  input += chunk.toString("utf8");
}

const flag = input.trim();

if (!flag || flag.length > 256) {
  process.stderr.write("Provide a flag containing 1 to 256 characters via stdin.\n");
  process.exitCode = 1;
} else {
  const digest = createHash("sha256").update(flag, "utf8").digest("hex");
  process.stdout.write(digest + "\n");
}
