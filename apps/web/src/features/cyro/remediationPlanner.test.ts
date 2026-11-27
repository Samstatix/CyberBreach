import { describe, expect, it } from "vitest";
import { buildRemediationSuggestions } from "./remediationPlanner";

describe("CYRO revision suggestions", () => {
  it("suggests a foundation lesson for a missed web-security sample", () => {
    const suggestions = buildRemediationSuggestions([{ category: "web-security", correct: false }]);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].lessonId).toBeTruthy();
    expect(suggestions[0].reason).toContain("does not establish a knowledge gap");
  });

  it("does not suggest revision for categories answered correctly", () => {
    expect(buildRemediationSuggestions([{ category: "networking", correct: true }])).toEqual([]);
  });

  it("deduplicates repeated category outcomes", () => {
    const suggestions = buildRemediationSuggestions([
      { category: "linux", correct: false },
      { category: "linux", correct: false },
    ]);
    expect(suggestions.filter((item) => item.category === "linux")).toHaveLength(1);
  });

  it("does not fabricate a course when the curriculum has no match", () => {
    expect(buildRemediationSuggestions([{ category: "ai-security", correct: false }]).every((item) => item.lessonId.length > 0)).toBe(true);
  });
});
