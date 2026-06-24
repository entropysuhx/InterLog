import { endOfMonth, endOfYear, format, startOfMonth, startOfYear } from "date-fns";

import { prisma } from "@/lib/db";
import type { WrappedInput } from "@/lib/ai/wrapped";

export async function aggregateWrapped(
  userId: string,
  period: "monthly" | "yearly",
  periodKey: string,
): Promise<{ input: WrappedInput; sourceRevision: string; activityCount: number }> {
  const anchor = new Date(
    period === "monthly" ? `${periodKey}-01T00:00:00` : `${periodKey}-01-01T00:00:00`,
  );
  const start = period === "monthly" ? startOfMonth(anchor) : startOfYear(anchor);
  const end = period === "monthly" ? endOfMonth(anchor) : endOfYear(anchor);
  const activities = await prisma.activity.findMany({
    where: { userId, startTime: { gte: start, lte: end }, duration: { not: null } },
    include: { category: true },
    orderBy: { startTime: "asc" },
  });
  const focusSessions = await prisma.focusSession.findMany({
    where: { userId, startTime: { gte: start, lte: end }, status: "COMPLETED" },
    orderBy: { duration: "desc" },
  });
  const reflections = await prisma.reflection.findMany({
    where: {
      userId,
      activityDate: { gte: format(start, "yyyy-MM-dd"), lte: format(end, "yyyy-MM-dd") },
    },
    select: { activityDate: true, id: true, updatedAt: true },
  });
  const reflectionDaysCount = new Set(reflections.map((reflection) => reflection.activityDate))
    .size;
  const byCategory = new Map<string, number>();
  const totalSeconds = activities.reduce((sum, activity) => {
    byCategory.set(
      activity.category.key,
      (byCategory.get(activity.category.key) ?? 0) + (activity.duration ?? 0),
    );
    return sum + (activity.duration ?? 0);
  }, 0);
  const topCategories = [...byCategory]
    .map(([category, seconds]) => ({
      category,
      hours: seconds / 3600,
      percentage: totalSeconds ? Math.round((seconds / totalSeconds) * 100) : 0,
    }))
    .sort((a, b) => b.hours - a.hours);
  const longest = focusSessions[0];
  const sourceRevision = activities
    .map((activity) => `${activity.id}:${activity.updatedAt.getTime()}`)
    .concat(reflections.map((reflection) => `${reflection.id}:${reflection.updatedAt.getTime()}`))
    .join("|");
  return {
    sourceRevision: Buffer.from(sourceRevision).toString("base64url").slice(0, 64),
    activityCount: activities.length,
    input: {
      period,
      periodLabel: format(start, period === "monthly" ? "MMMM yyyy" : "yyyy"),
      totalTrackedHours: totalSeconds / 3600,
      focusHours:
        activities
          .filter((activity) => activity.category.key === "deep-work")
          .reduce((sum, activity) => sum + (activity.duration ?? 0), 0) / 3600,
      topCategories,
      longestFocusSession: longest
        ? {
            durationMinutes: Math.round((longest.duration ?? 0) / 60),
            title: longest.title,
            date: format(longest.startTime, "MMM d"),
          }
        : null,
      mostProductiveDay: null,
      reflectionDaysCount,
    },
  };
}
