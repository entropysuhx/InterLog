import { describe, expect, it } from "vitest";

import { calculateAnalytics } from "@/lib/analytics/calculate";
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
});

