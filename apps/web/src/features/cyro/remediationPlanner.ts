import { academyCourses } from "../academy/academyContent";
import type { DiagnosticCategory } from "./diagnosticAssessment";

export type RemediationSuggestion = {
  category: DiagnosticCategory;
  courseTitle: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  reason: string;
};

const courseMatches: Record<DiagnosticCategory, string[]> = {
  networking: ["network", "foundation"],
  linux: ["linux"],
  "web-security": ["web-security"],
  cryptography: ["cryptography", "crypto"],
  forensics: ["forensics"],
  "ai-security": ["ai-security", "artificial-intelligence"],
};

/**
 * Suggest a starting lesson for categories missed in the informal self-check.
 * A missed item is a revision suggestion, not proof of a knowledge gap.
 */
export function buildRemediationSuggestions(
  outcomes: Array<{ category: DiagnosticCategory; correct: boolean }>,
): RemediationSuggestion[] {
  const missed = new Set(outcomes.filter((item) => !item.correct).map((item) => item.category));
  const suggestions: RemediationSuggestion[] = [];
  for (const category of missed) {
    const terms = courseMatches[category];
    const course = academyCourses.find((item) =>
      terms.some((term) => (item.id + " " + item.title).toLowerCase().includes(term)),
    );
    const lesson = course?.lessons[0];
    if (!course || !lesson) continue;
    suggestions.push({
      category,
      courseTitle: course.title,
      courseId: course.id,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      reason: "You missed the sample question in this area. Revisiting one foundation lesson may help; this result alone does not establish a knowledge gap.",
    });
  }
  return suggestions;
}
