import { describe, expect, it } from "vitest";

import { calculateAnalytics, countReflectionDaysInRange } from "@/lib/analytics/calculate";
import { makeActivity } from "@/../tests/factories";

describe("calculateAnalytics", () => {
  it("calculates tracked and focus totals", () => {
    const snapshot = calculateAnalytics(
      [
        makeActivity({ duration: 3600 }),
        makeActivity({ id: "learning", categoryKey: "learning", categoryName: "Learning", duration: 1800 }),
      ],
      7,
      new Date("2026-06-10T12:00:00.000Z"),
    );
    expect(snapshot.totalTrackedSeconds).toBe(5400);
    expect(snapshot.focusSeconds).toBe(3600);
    expect(snapshot.categoryBreakdown).toHaveLength(2);
  });

  it("excludes in-progress activities from tracked totals", () => {
    const snapshot = calculateAnalytics([makeActivity({ endTime: null, duration: null })]);
    expect(snapshot.totalTrackedSeconds).toBe(0);
  });

  it("counts only reflection days in the selected period", () => {
    const reflections = [
      { id: "one", activityDate: "2026-06-15", prompt: "Prompt", answer: "Answer", updatedAt: "2026-06-15T12:00:00.000Z" },
      { id: "two", activityDate: "2026-06-15", prompt: "Optional", answer: "Answer", updatedAt: "2026-06-15T12:00:00.000Z" },
      { id: "three", activityDate: "2026-06-20", prompt: "Prompt", answer: "Answer", updatedAt: "2026-06-20T12:00:00.000Z" },
      { id: "four", activityDate: "2026-05-31", prompt: "Prompt", answer: "Answer", updatedAt: "2026-05-31T12:00:00.000Z" },
    ];

    expect(
      countReflectionDaysInRange(reflections, new Date(2026, 5, 15), new Date(2026, 5, 21)),
    ).toBe(2);
  });
});
