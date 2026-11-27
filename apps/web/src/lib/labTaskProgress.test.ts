import { describe, expect, it } from "vitest";
import { isGuestLabTaskAnswerCorrect } from "./labTaskProgress";

describe("guest Linux lab answer validation", () => {
  it("accepts the four findings shown by the simulated evidence", () => {
    expect(isGuestLabTaskAnswerCorrect("linux-auth-source", "192.0.2.44")).toBe(true);
    expect(isGuestLabTaskAnswerCorrect("linux-listening-ports", "22,80,443")).toBe(true);
    expect(isGuestLabTaskAnswerCorrect("linux-default-gateway", "192.0.2.1")).toBe(true);
    expect(isGuestLabTaskAnswerCorrect("linux-current-user", "analyst")).toBe(true);
  });

  it("normalizes whitespace and letter case but rejects wrong findings", () => {
    expect(isGuestLabTaskAnswerCorrect("linux-current-user", " ANALYST ")).toBe(true);
    expect(isGuestLabTaskAnswerCorrect("linux-current-user", "root")).toBe(false);
    expect(isGuestLabTaskAnswerCorrect("unknown-task", "anything")).toBe(false);
  });
});
