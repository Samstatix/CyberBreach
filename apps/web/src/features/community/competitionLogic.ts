export type CompetitionStatus = "upcoming" | "live" | "completed";

export function slugifyCompetitionTitle(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getCompetitionStatus(startsAt: string, endsAt: string, now = new Date()): CompetitionStatus {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const current = now.getTime();
  if (current < start) return "upcoming";
  if (current < end) return "live";
  return "completed";
}

export function parseChallengeSlugs(value: string): string[] {
  return [...new Set(value.split(",").map((slug) => slug.trim().toLowerCase()).filter(Boolean))];
}

export function isValidCompetitionWindow(startsAt: string, endsAt: string, now = new Date()): boolean {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const current = now.getTime();
  return Number.isFinite(start) && Number.isFinite(end) && start > current && end > start && end - start <= 14 * 24 * 60 * 60 * 1000;
}
