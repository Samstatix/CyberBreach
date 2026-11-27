export type AchievementDefinition = {
  slug: string;
  title: string;
  description: string;
  requirement: string;
  icon: string;
};

export const achievementCatalog: AchievementDefinition[] = [
  { slug: "first-lesson", title: "First Steps", description: "Complete your first Cyber Academy lesson.", requirement: "Complete 1 Academy lesson", icon: "book-open" },
  { slug: "academy-five", title: "Curious Mind", description: "Complete five Cyber Academy lessons.", requirement: "Complete 5 Academy lessons", icon: "graduation-cap" },
  { slug: "academy-fifteen", title: "Dedicated Learner", description: "Complete fifteen Cyber Academy lessons.", requirement: "Complete 15 Academy lessons", icon: "library" },
  { slug: "first-solve", title: "First Blood", description: "Solve your first CTF challenge.", requirement: "Solve 1 CTF challenge", icon: "flag" },
  { slug: "five-solves", title: "Problem Solver", description: "Solve five CTF challenges.", requirement: "Solve 5 CTF challenges", icon: "target" },
  { slug: "ten-solves", title: "Threat Hunter", description: "Solve ten CTF challenges.", requirement: "Solve 10 CTF challenges", icon: "crosshair" },
  { slug: "all-rounder", title: "All-Round Operator", description: "Complete five Academy lessons and solve three CTF challenges.", requirement: "Complete 5 lessons and solve 3 challenges", icon: "shield-check" },
  { slug: "centurion", title: "Centurion", description: "Earn 1,000 total experience points.", requirement: "Earn 1,000 XP", icon: "award" },
  { slug: "full-clear", title: "Arena Finisher", description: "Solve all eighteen launch CTF challenges.", requirement: "Solve all 18 launch challenges", icon: "trophy" },
  { slug: "first-operation", title: "First Response", description: "Complete your first incident-response mission.", requirement: "Complete 1 Operations mission", icon: "shield-check" },
  { slug: "three-operations", title: "Incident Handler", description: "Complete all three launch incident-response missions.", requirement: "Complete all 3 Operations missions", icon: "activity" },
  { slug: "first-lab", title: "Hands-On Analyst", description: "Complete your first browser-based Cyber Labs investigation.", requirement: "Complete 1 browser lab task", icon: "terminal" },
];
