import { describe, expect, it } from "vitest";
import { diagnosticQuestions, scoreDiagnostic } from "./diagnosticAssessment";

describe("CYRO diagnostic self-check", () => {
  it("covers six distinct cybersecurity learning domains", () => {
    expect(diagnosticQuestions).toHaveLength(6);
    expect(new Set(diagnosticQuestions.map((question) => question.category)).size).toBe(6);
    for (const question of diagnosticQuestions) {
      expect(question.options.some((option) => option.id === question.correctOption)).toBe(true);
      expect(question.explanation.length).toBeGreaterThan(20);
    }
  });

  it("scores correct and incorrect responses without treating missing answers as correct", () => {
    const answers = Object.fromEntries(diagnosticQuestions.map((question, index) => [question.id, index === 0 ? question.correctOption : "not-correct"]));
    const result = scoreDiagnostic(answers);
    expect(result.total).toBe(6);
    expect(result.correct).toBe(1);
    expect(result.percentage).toBe(17);
    expect(result.byCategory.filter((item) => item.correct)).toHaveLength(1);
  });

  it("returns zero for an empty self-check response set", () => {
    expect(scoreDiagnostic({}).percentage).toBe(0);
  });
});
