import { describe, expect, it } from "vitest";
import { skillTrees } from "./skillTrees";

describe("CyberBreach operator skill trees", () => {
  it("provides eleven non-empty specialization paths", () => {
    expect(skillTrees).toHaveLength(11);
    expect(skillTrees.every((tree) => tree.nodes.length > 0)).toBe(true);
    expect(new Set(skillTrees.map((tree) => tree.id)).size).toBe(skillTrees.length);
  });

  it("connects the three incident-response missions to one dedicated path", () => {
    const incidentResponse = skillTrees.find((tree) => tree.id === "incident-response");
    expect(incidentResponse).toBeDefined();
    expect(incidentResponse?.nodes.map((node) => node.reference)).toEqual([
      "auth-burst",
      "dns-burst",
      "priv-change",
    ]);
    expect(incidentResponse?.nodes.every((node) => node.kind === "mission")).toBe(true);
  });

  it("keeps every skill node identifier unique", () => {
    const ids = skillTrees.flatMap((tree) => tree.nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
