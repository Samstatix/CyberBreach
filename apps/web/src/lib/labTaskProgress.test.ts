import { describe, expect, it } from "vitest";
import { getGuestCompletedLabTaskIds } from "./labTaskProgress";

describe("guest Linux lab progress", () => {
  it("does not award or import client-verified lab completions", () => {
    expect(getGuestCompletedLabTaskIds()).toEqual([]);
  });
});
