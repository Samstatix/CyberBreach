import { describe, expect, it } from "vitest";
import { getGuestCompletedOperationIds } from "./operationsProgress";

describe("guest Operations progress", () => {
  it("does not award or import client-verified mission completions", () => {
    expect(getGuestCompletedOperationIds()).toEqual([]);
  });
});
