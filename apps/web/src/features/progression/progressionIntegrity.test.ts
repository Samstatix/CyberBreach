import { describe, expect, it } from "vitest";
import { academyCourses, findLesson } from "../academy/academyContent";
import { challengeCatalog } from "../ctf/challengeCatalog";
import { achievementCatalog } from "./achievementCatalog";
import { skillTrees } from "./skillTrees";

describe("CyberBreach progression catalogue integrity", () => {
  const nodes = skillTrees.flatMap((tree) => tree.nodes);

  it("maps every Academy lesson to a valid skill-tree node", () => {
    const curriculumLessonIds = academyCourses.flatMap((course) => course.lessons.map((lesson) => lesson.id));
    const skillLessonIds = nodes.filter((node) => node.kind === "lesson").map((node) => node.reference);

    expect(new Set(skillLessonIds).size).toBe(skillLessonIds.length);
    expect(new Set(skillLessonIds)).toEqual(new Set(curriculumLessonIds));
    for (const lessonId of skillLessonIds) expect(findLesson(lessonId)).toBeDefined();
  });

  it("maps every published CTF challenge into exactly one specialization tree", () => {
    const challengeIds = nodes.filter((node) => node.kind === "challenge").map((node) => node.reference);
    expect(new Set(challengeIds).size).toBe(challengeIds.length);
    expect(new Set(challengeIds)).toEqual(new Set(challengeCatalog.map((challenge) => challenge.slug)));
  });

  it("keeps all Operations missions and Linux lab tasks represented", () => {
    const missionIds = nodes.filter((node) => node.kind === "mission").map((node) => node.reference);
    const labIds = nodes.filter((node) => node.kind === "lab").map((node) => node.reference);
    expect(new Set(missionIds)).toEqual(new Set(["auth-burst", "dns-burst", "priv-change"]));
    expect(new Set(labIds)).toEqual(new Set([
      "linux-auth-source",
      "linux-listening-ports",
      "linux-default-gateway",
      "linux-current-user"
    ]));
  });

  it("uses unique achievement slugs and unique skill-tree identifiers", () => {
    expect(new Set(achievementCatalog.map((achievement) => achievement.slug)).size).toBe(achievementCatalog.length);
    expect(new Set(skillTrees.map((tree) => tree.id)).size).toBe(skillTrees.length);
    expect(skillTrees).toHaveLength(11);
  });
});
