import { endOfDay, startOfDay, subDays } from "date-fns";

import { CATEGORY_NAMES, type ActivityView, type CategoryKey } from "@/types";

export type AnalyticsSnapshot = {
  totalTrackedSeconds: number;
  focusSeconds: number;
  activityCount: number;
  categoryBreakdown: { key: CategoryKey; name: string; seconds: number; sessions: number }[];
  dailyTrend: { date: string; seconds: number }[];
};

export function calculateAnalytics(
  activities: ActivityView[],
  days = 7,
  now = new Date(),
): AnalyticsSnapshot {
  const completed = activities.filter((activity) => activity.duration !== null);
  const categoryMap = new Map<CategoryKey, { seconds: number; sessions: number }>();

  for (const activity of completed) {
    const current = categoryMap.get(activity.categoryKey) ?? { seconds: 0, sessions: 0 };
    current.seconds += activity.duration ?? 0;
    current.sessions += 1;
    categoryMap.set(activity.categoryKey, current);
  }

  const dailyTrend = Array.from({ length: days }, (_, offset) => {
    const date = subDays(now, days - offset - 1);
    const start = startOfDay(date).getTime();
    const end = endOfDay(date).getTime();
    const seconds = completed
      .filter((activity) => {
        const activityTime = new Date(activity.startTime).getTime();
        return activityTime >= start && activityTime <= end;
      })
      .reduce((sum, activity) => sum + (activity.duration ?? 0), 0);
    return { date: date.toISOString(), seconds };
  });

  return {
    totalTrackedSeconds: completed.reduce((sum, activity) => sum + (activity.duration ?? 0), 0),
    focusSeconds: completed
      .filter((activity) => activity.categoryKey === "deep-work")
      .reduce((sum, activity) => sum + (activity.duration ?? 0), 0),
    activityCount: activities.length,
    categoryBreakdown: [...categoryMap.entries()]
      .map(([key, value]) => ({ key, name: CATEGORY_NAMES[key], ...value }))
      .sort((a, b) => b.seconds - a.seconds),
    dailyTrend,
  };
}

