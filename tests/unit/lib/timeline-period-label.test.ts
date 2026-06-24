import { describe, expect, it } from "vitest";

import { getTimelinePeriodLabel } from "@/lib/timeline/period-label";

const referenceDate = new Date(2026, 5, 24, 12);

describe("getTimelinePeriodLabel", () => {
  it("uses relative daily labels only for adjacent dates", () => {
    expect(getTimelinePeriodLabel("daily", new Date(2026, 5, 24), 1, referenceDate)).toBe("Today");
    expect(getTimelinePeriodLabel("daily", new Date(2026, 5, 23), 1, referenceDate)).toBe(
      "Yesterday",
    );
    expect(getTimelinePeriodLabel("daily", new Date(2026, 5, 25), 1, referenceDate)).toBe(
      "Tomorrow",
    );
    expect(getTimelinePeriodLabel("daily", new Date(2026, 5, 22), 1, referenceDate)).toBe(
      "Monday, June 22, 2026",
    );
  });

  it("labels weeks relative to the selected week", () => {
    expect(getTimelinePeriodLabel("weekly", new Date(2026, 5, 24), 1, referenceDate)).toBe(
      "This Week",
    );
    expect(getTimelinePeriodLabel("weekly", new Date(2026, 5, 17), 1, referenceDate)).toBe(
      "Last Week",
    );
    expect(getTimelinePeriodLabel("weekly", new Date(2026, 6, 1), 1, referenceDate)).toBe(
      "Next Week",
    );
    expect(getTimelinePeriodLabel("weekly", new Date(2026, 5, 8), 1, referenceDate)).toBe(
      "Week of Jun 8, 2026",
    );
  });

  it("uses the selected calendar month outside the current month", () => {
    expect(getTimelinePeriodLabel("monthly", new Date(2026, 5, 1), 1, referenceDate)).toBe(
      "This Month",
    );
    expect(getTimelinePeriodLabel("monthly", new Date(2026, 4, 1), 1, referenceDate)).toBe(
      "May 2026",
    );
  });
});
