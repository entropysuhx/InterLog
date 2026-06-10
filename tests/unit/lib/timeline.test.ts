import { describe, expect, it } from "vitest";

import { assignLanes, getGaps } from "@/lib/timeline/layout";
import { makeActivity } from "@/../tests/factories";

describe("timeline layout", () => {
  it("assigns overlapping activities to separate lanes", () => {
    const activities = [
      makeActivity({ id: "a" }),
      makeActivity({
        id: "b",
        startTime: "2026-06-10T09:30:00.000Z",
        endTime: "2026-06-10T10:30:00.000Z",
      }),
    ];
    const result = assignLanes(activities);
    expect(result.map((activity) => activity.laneIndex)).toEqual([0, 1]);
    expect(result[0].totalLanes).toBe(2);
  });

  it("detects gaps of at least 45 minutes", () => {
    const result = getGaps([
      makeActivity({ id: "a", endTime: "2026-06-10T10:00:00.000Z" }),
      makeActivity({
        id: "b",
        startTime: "2026-06-10T11:00:00.000Z",
        endTime: "2026-06-10T12:00:00.000Z",
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].durationMinutes).toBe(60);
  });
});

