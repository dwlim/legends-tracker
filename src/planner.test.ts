import { describe, expect, it } from "vitest";

import { buildPlanner, formatDuration, parseDurationInput } from "./planner";

describe("planner", () => {
  it("parses mixed duration strings", () => {
    expect(parseDurationInput("2d 6h")).toBe(3240);
    expect(parseDurationInput("18h")).toBe(1080);
    expect(parseDurationInput("90m")).toBe(90);
    expect(parseDurationInput("1.5")).toBe(90);
    expect(parseDurationInput("")).toBeNull();
  });

  it("formats durations compactly", () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(3240)).toBe("2d 6h");
  });

  it("assigns upgrades to the earliest available builder", () => {
    const plan = buildPlanner({
      builderCount: 2,
      startAt: new Date("2026-06-09T08:00:00.000Z"),
      upgrades: [
        { id: "a", name: "Archer Tower", durationMinutes: 120, category: "defense" },
        { id: "b", name: "Clan Castle", durationMinutes: 180, category: "utility" },
        { id: "c", name: "Wall Segment", durationMinutes: 60, category: "walls" },
      ],
    });

    expect(plan.assignments.map((assignment) => assignment.builderIndex)).toEqual([
      0,
      1,
      0,
    ]);
    expect(plan.summary.totalDurationMinutes).toBe(360);
    expect(plan.summary.idleMinutes).toBe(0);
    expect(plan.summary.upgradeCount).toBe(3);
  });
});
