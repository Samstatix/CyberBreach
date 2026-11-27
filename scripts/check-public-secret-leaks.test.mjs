import test from "node:test";
import assert from "node:assert/strict";
import { findPrivateContentViolations } from "./security-scan-rules.mjs";

test("clean public metadata and ordinary learning text pass", () => {
  const source = [
    "insert into public.challenges (slug, title) values ('intro', 'Introduction');",
    "The learner should review the evidence and try again.",
    "Answer verification is performed by a trusted database function.",
  ].join("\n");

  assert.deepEqual(findPrivateContentViolations(source), []);
});

test("detects private answer material and reports its line", () => {
  const source = [
    "-- public challenge metadata",
    "correct_option_id = 'contain-and-verify';",
    "select true;",
  ].join("\n");

  assert.deepEqual(findPrivateContentViolations(source), [
    { label: "plaintext operations answer", line: 2 },
    { label: "legacy semantic Operations answer ID", line: 2 },
  ]);
});

test("detects hashes, walkthroughs and client-side answer maps", () => {
  const source = [
    "flag_hash = '" + "a".repeat(64) + "';",
    "walkthrough_md = 'step-by-step solution';",
    "const answers = GUEST_LAB_ANSWERS;",
  ].join("\n");

  const labels = findPrivateContentViolations(source).map((finding) => finding.label);
  assert.ok(labels.includes("literal SHA-256 CTF flag"));
  assert.ok(labels.includes("inline walkthrough content"));
  assert.ok(labels.includes("client-side lab answer map"));
});

test("does not retain regex state between repeated scans", () => {
  const source = "insert into public.challenge_secrets values (...);";
  assert.equal(findPrivateContentViolations(source).length, 1);
  assert.equal(findPrivateContentViolations(source).length, 1);
});
