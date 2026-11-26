import { describe, expect, it } from "vitest";
import { academyCourses, findCourse, findLesson } from "./academyContent";

describe("CyberBreach Academy curriculum", () => {
  it("includes the extended web, cryptography, forensics and AI learning paths", () => {
    expect(academyCourses.length).toBeGreaterThanOrEqual(7);
    const totalLessons = academyCourses.reduce((total, course) => total + course.lessons.length, 0);
    expect(totalLessons).toBeGreaterThanOrEqual(19);
  });

  it("uses unique course and lesson identifiers", () => {
    const courseIds = academyCourses.map((course) => course.id);
    const lessonIds = academyCourses.flatMap((course) => course.lessons.map((lesson) => lesson.id));

    expect(new Set(courseIds).size).toBe(courseIds.length);
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
  });

  it("gives every lesson objectives, teaching content and a knowledge check", () => {
    for (const course of academyCourses) {
      expect(course.lessons.length).toBeGreaterThan(0);
      for (const lesson of course.lessons) {
        expect(lesson.objectives.length).toBeGreaterThan(0);
        expect(lesson.blocks.length).toBeGreaterThan(0);
        expect(lesson.keyTerms.length).toBeGreaterThan(0);
        expect(lesson.options.length).toBeGreaterThanOrEqual(2);
        expect(lesson.options.some((option) => option.id === lesson.correctOption)).toBe(true);
        expect(lesson.feedback.length).toBeGreaterThan(20);
      }
    }
  });

  it("resolves each lesson to exactly one parent course", () => {
    for (const course of academyCourses) {
      expect(findCourse(course.id)?.title).toBe(course.title);
      for (const lesson of course.lessons) {
        const result = findLesson(lesson.id);
        expect(result?.course.id).toBe(course.id);
        expect(result?.lesson.id).toBe(lesson.id);
      }
    }
  });

  it("uses secure external reference URLs", () => {
    for (const course of academyCourses) {
      for (const lesson of course.lessons) {
        for (const source of lesson.sources) {
          expect(source.url.startsWith("https://")).toBe(true);
        }
      }
    }
  });
});
