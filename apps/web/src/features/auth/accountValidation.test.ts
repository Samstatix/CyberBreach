import { describe, expect, it } from "vitest";
import { isValidBio, isValidDisplayName, isValidUsername, normalizeUsername } from "./accountValidation";

describe("account profile validation", () => {
  it("normalizes usernames to the allowed lowercase character set", () => {
    expect(normalizeUsername("Nafis Inam!_7")).toBe("nafisinam_7");
  });

  it("accepts only 3–24 lowercase letters, digits and underscores", () => {
    expect(isValidUsername("cyber_01")).toBe(true);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("UPPERCASE")).toBe(false);
    expect(isValidUsername("has-dash")).toBe(false);
    expect(isValidUsername("a".repeat(25))).toBe(false);
  });

  it("requires a display name between 2 and 40 characters", () => {
    expect(isValidDisplayName("Nafis")).toBe(true);
    expect(isValidDisplayName(" ")).toBe(false);
    expect(isValidDisplayName("a".repeat(41))).toBe(false);
  });

  it("limits profile bios to 160 characters", () => {
    expect(isValidBio("Learning cybersecurity")).toBe(true);
    expect(isValidBio("a".repeat(161))).toBe(false);
  });
});
