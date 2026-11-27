import { describe, expect, it } from "vitest";
import { isGuestOperationsAnswerCorrect } from "./operationsProgress";

describe("guest Operations answer validation", () => {
  it("accepts the intended evidence-based response for each mission", () => {
    expect(isGuestOperationsAnswerCorrect("auth-burst", "preserve-contain-verify")).toBe(true);
    expect(isGuestOperationsAnswerCorrect("dns-burst", "preserve-isolate")).toBe(true);
    expect(isGuestOperationsAnswerCorrect("priv-change", "preserve-verify-revoke")).toBe(true);
  });

  it("rejects incorrect and unknown mission responses", () => {
    expect(isGuestOperationsAnswerCorrect("auth-burst", "delete-logs")).toBe(false);
    expect(isGuestOperationsAnswerCorrect("dns-burst", "block-all-dns")).toBe(false);
    expect(isGuestOperationsAnswerCorrect("unknown-mission", "anything")).toBe(false);
  });
});
