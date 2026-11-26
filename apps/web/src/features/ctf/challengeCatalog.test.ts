import { describe, expect, it } from "vitest";
import { challengeCatalog, getChallengesForCategory } from "./challengeCatalog";

const categories = ["web-exploitation", "cryptography", "reverse-engineering", "binary-exploitation", "forensics", "osint-misc"] as const;

describe("CyberBreach CTF catalogue", () => {
  it("contains three original challenges in each agreed category", () => {
    for (const category of categories) expect(getChallengesForCategory(category)).toHaveLength(3);
    expect(challengeCatalog).toHaveLength(18);
  });

  it("covers medium, hard and expert reasoning in every category", () => {
    for (const category of categories) {
      expect(new Set(getChallengesForCategory(category).map((challenge) => challenge.difficulty))).toEqual(new Set(["medium", "hard", "expert"]));
    }
  });

  it("has unique ids and slugs, progressive hints and explicit safety scope", () => {
    expect(new Set(challengeCatalog.map((challenge) => challenge.id)).size).toBe(challengeCatalog.length);
    expect(new Set(challengeCatalog.map((challenge) => challenge.slug)).size).toBe(challengeCatalog.length);
    for (const challenge of challengeCatalog) {
      expect(challenge.hints).toHaveLength(3);
      expect(challenge.safety.length).toBeGreaterThan(20);
      expect(challenge.points).toBeGreaterThan(0);
      expect(challenge).not.toHaveProperty("flag");
      expect(challenge).not.toHaveProperty("walkthrough");
      expect(challenge).not.toHaveProperty("flagHash");
    }
  });
});
