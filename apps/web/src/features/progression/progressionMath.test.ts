import { describe, expect, it } from "vitest";
import { getLevelProgress, getRankForLevel } from "./progressionMath";

describe("CyberBreach progression mathematics", () => {
  it("starts new learners at level one with no XP", () => {
    expect(getLevelProgress(0)).toMatchObject({
      level: 1,
      currentLevelXp: 0,
      nextLevelXp: 250,
      xpToNextLevel: 250,
      progressPercent: 0,
    });
  });

  it("moves to the next level at the exact cumulative XP threshold", () => {
    expect(getLevelProgress(250)).toMatchObject({
      level: 2,
      currentLevelXp: 250,
      nextLevelXp: 750,
      xpIntoLevel: 0,
      xpToNextLevel: 500,
    });
    expect(getLevelProgress(750).level).toBe(3);
  });

  it("clamps invalid or negative XP to zero", () => {
    expect(getLevelProgress(-10).level).toBe(1);
    expect(getLevelProgress(Number.NaN).level).toBe(1);
  });

  it("assigns ranks at the published level thresholds", () => {
    expect(getRankForLevel(1)).toBe("Recruit");
    expect(getRankForLevel(2)).toBe("Trainee");
    expect(getRankForLevel(4)).toBe("Analyst");
    expect(getRankForLevel(7)).toBe("Specialist");
    expect(getRankForLevel(10)).toBe("Operator");
    expect(getRankForLevel(15)).toBe("Senior Operator");
    expect(getRankForLevel(20)).toBe("Elite");
  });
});
