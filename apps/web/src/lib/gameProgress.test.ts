import { describe, expect, it } from "vitest";
import { getLevelForXp } from "./gameProgress";

describe("CyberBreach player level progression", () => {
  it("starts every new player at level one", () => {
    expect(getLevelForXp(0)).toBe(1);
    expect(getLevelForXp(99)).toBe(1);
  });

  it("unlocks the next level at the exact XP threshold", () => {
    expect(getLevelForXp(100)).toBe(2);
    expect(getLevelForXp(399)).toBe(2);
    expect(getLevelForXp(400)).toBe(3);
    expect(getLevelForXp(900)).toBe(4);
  });

  it("continues scaling without a fixed level cap", () => {
    expect(getLevelForXp(10000)).toBe(11);
    expect(getLevelForXp(40000)).toBe(21);
  });
});
