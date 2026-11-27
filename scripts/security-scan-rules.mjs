/**
 * Shared detection rules for the public-source private-content guardrail.
 * Keep these patterns conservative: false positives block releases, while
 * missed private answer material can compromise competitions.
 */

export const privateContentRules = [
  ["challenge secret seed", /insert\s+into\s+public\.challenge_secrets\b/i],
  ["challenge walkthrough seed", /insert\s+into\s+public\.challenge_solutions\b/i],
  ["plaintext operations answer", /correct_option_id\s*[,=]\s*'[^']+'/i],
  ["literal SHA-256 lab answer", /answer_hash\s*[,=]\s*'[0-9a-f]{64}'/i],
  ["literal SHA-256 CTF flag", /flag_hash\s*[,=]\s*'[0-9a-f]{64}'/i],
  ["inline walkthrough content", /walkthrough_md\s*[,=]\s*'/i],
  ["inline defensive solution content", /defensive_notes_md\s*[,=]\s*'/i],
  ["client-side Operations answer map", /GUEST_MISSION_ANSWERS|isGuestOperationsAnswerCorrect/i],
  ["client-side lab answer map", /GUEST_LAB_ANSWERS|isGuestLabTaskAnswerCorrect/i],
  ["legacy semantic Operations answer ID", /preserve-contain-verify|preserve-isolate|preserve-verify-revoke/i],
];

export function findPrivateContentViolations(content) {
  const findings = [];
  for (const [label, pattern] of privateContentRules) {
    const match = pattern.exec(content);
    if (match) {
      findings.push({
        label,
        line: content.slice(0, match.index).split("\n").length,
      });
    }
  }
  return findings;
}
