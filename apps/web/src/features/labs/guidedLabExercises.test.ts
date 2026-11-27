import { describe, expect, it } from "vitest";
import { checkLabAnswer, getLabHint, guidedLabExercises, normalizeLabAnswer } from "./guidedLabExercises";

describe("guided Cyber Labs exercises", () => {
  it("provides one exercise for each safe lab discipline", () => {
    expect(guidedLabExercises.map((exercise) => exercise.id)).toEqual(["web", "crypto", "reverse", "memory", "forensics", "osint"]);
  });

  it("accepts normalised correct answers and rejects blank or incorrect answers", () => {
    const web = guidedLabExercises.find((exercise) => exercise.id === "web")!;
    expect(checkLabAnswer(web, "  OBJECT-LEVEL AUTHORIZATION! ")).toBe(true);
    expect(checkLabAnswer(web, " ")).toBe(false);
    expect(checkLabAnswer(web, "authentication")).toBe(false);
  });

  it("returns progressively more specific hints and clamps levels", () => {
    const item = guidedLabExercises[0];
    expect(getLabHint(item, 0)).toBe(item.hints[0]);
    expect(getLabHint(item, 2)).toBe(item.hints[2]);
    expect(getLabHint(item, 100)).toBe(item.hints[2]);
    expect(getLabHint(item, -10)).toBe(item.hints[0]);
  });

  it("normalises whitespace and punctuation without changing semantic text", () => {
    expect(normalizeLabAnswer("  Hello,   WORLD! ")).toBe("hello world");
  });
});
