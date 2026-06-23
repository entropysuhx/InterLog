import { describe, expect, it } from "vitest";

import { assignLanes, getBlockMetrics, getGaps, getTimelineActivitiesForDate } from "@/lib/timeline/layout";
import { makeActivity } from "@/../tests/factories";

function localTime(year: number, month: number, day: number, hour: number, minute = 0): string {
  return new Date(year, month, day, hour, minute).toISOString();
}

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

  it("positions activities logged after midnight from the midnight row", () => {
    const activity = makeActivity({
      startTime: localTime(2026, 5, 21, 0, 5),
      endTime: localTime(2026, 5, 21, 0, 35),
      duration: 1800,
    });
    const [segment] = getTimelineActivitiesForDate([activity], new Date(2026, 5, 21));
    const metrics = getBlockMetrics(segment);

    expect(new Date(segment.startTime).getHours()).toBe(0);
    expect(metrics.top).toBeGreaterThanOrEqual(0);
    expect(metrics.top).toBeLessThan(80);
  });

  it("renders the correct portion of a cross-day activity on both days", () => {
    const activity = makeActivity({
      startTime: localTime(2026, 5, 20, 23),
      endTime: localTime(2026, 5, 21, 2),
      duration: 3 * 60 * 60,
    });
    const [firstDay] = getTimelineActivitiesForDate([activity], new Date(2026, 5, 20));
    const [secondDay] = getTimelineActivitiesForDate([activity], new Date(2026, 5, 21));

    expect(firstDay.duration).toBe(60 * 60);
    expect(firstDay.continuesIntoNextDay).toBe(true);
    expect(secondDay.duration).toBe(2 * 60 * 60);
    expect(secondDay.continuesFromPreviousDay).toBe(true);
    expect(getBlockMetrics(firstDay).top + getBlockMetrics(firstDay).height).toBeLessThanOrEqual(
      24 * 80,
    );
  });

  it("keeps a short end-of-day segment at the minimum visual height within the timeline", () => {
    const activity = makeActivity({
      startTime: localTime(2026, 5, 20, 23, 39),
      endTime: localTime(2026, 5, 21, 0),
      duration: 21 * 60,
    });
    const [segment] = getTimelineActivitiesForDate([activity], new Date(2026, 5, 20));
    const metrics = getBlockMetrics(segment);

    expect(metrics.height).toBe(36);
    expect(metrics.top + metrics.height).toBeLessThanOrEqual(24 * 80);
  });
});
