import { describe, expect, it } from "vitest";
import {
  getCompetitionStatus,
  isValidCompetitionWindow,
  parseChallengeSlugs,
  slugifyCompetitionTitle,
} from "./competitionLogic";

describe("competition event logic", () => {
  it("creates URL-safe event slugs", () => {
    expect(slugifyCompetitionTitle("CollabCircle Weekly CTF — Round 1")).toBe("collabcircle-weekly-ctf-round-1");
  });

  it("deduplicates and normalizes challenge slugs", () => {
    expect(parseChallengeSlugs("WEB-ONE, crypto-two, web-one, ")).toEqual(["web-one", "crypto-two"]);
  });

  it("classifies upcoming, live and completed events", () => {
    const now = new Date("2026-11-27T12:00:00Z");
    expect(getCompetitionStatus("2026-11-28T12:00:00Z", "2026-11-29T12:00:00Z", now)).toBe("upcoming");
    expect(getCompetitionStatus("2026-11-27T11:00:00Z", "2026-11-27T13:00:00Z", now)).toBe("live");
    expect(getCompetitionStatus("2026-11-25T11:00:00Z", "2026-11-26T13:00:00Z", now)).toBe("completed");
  });

  it("requires future event windows of no more than fourteen days", () => {
    const now = new Date("2026-11-27T12:00:00Z");
    expect(isValidCompetitionWindow("2026-11-28T12:00:00Z", "2026-11-29T12:00:00Z", now)).toBe(true);
    expect(isValidCompetitionWindow("2026-11-26T12:00:00Z", "2026-11-29T12:00:00Z", now)).toBe(false);
    expect(isValidCompetitionWindow("2026-11-28T12:00:00Z", "2026-12-15T12:00:00Z", now)).toBe(false);
  });
});
