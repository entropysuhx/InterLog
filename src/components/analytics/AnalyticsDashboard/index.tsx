"use client";

import { BarChart3, Brain, Clock3, NotebookPen } from "lucide-react";
import dynamic from "next/dynamic";
import { differenceInCalendarDays, endOfDay, endOfMonth, startOfWeek, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";

import { calculateAnalytics, countReflectionDaysInRange } from "@/lib/analytics/calculate";
import { formatDuration } from "@/lib/utils";
import type { ActivityView, ReflectionView } from "@/types";

const chartStyles = {
  "deep-work": "bg-activity-deep-work-chart",
  learning: "bg-activity-learning-chart",
  reflection: "bg-activity-reflection-chart",
  exercise: "bg-activity-exercise-chart",
  social: "bg-activity-social-chart",
  meeting: "bg-activity-meeting-chart",
  admin: "bg-activity-admin-chart",
  break: "bg-activity-break-chart",
  personal: "bg-activity-personal-chart",
} as const;

const TrendChart = dynamic(() => import("@/components/analytics/TrendChart"), {
  ssr: false,
  loading: () => <div className="min-h-panel-sm animate-pulse rounded-lg bg-surface-subtle" />,
});

type AnalyticsDashboardProps = {
  activities: ActivityView[];
  reflections: ReflectionView[];
  weekStartsOn: 0 | 1;
};

export default function AnalyticsDashboard({
  activities,
  reflections,
  weekStartsOn,
}: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const now = useMemo(() => new Date(), []);
  const periodBounds = useMemo(() => {
    const start = period === "weekly" ? startOfWeek(now, { weekStartsOn }) : startOfMonth(now);
    const end = period === "weekly" ? endOfDay(now) : endOfMonth(now);
    return { start, end };
  }, [now, period, weekStartsOn]);
  const periodActivities = useMemo(() => {
    return activities.filter((activity) => {
      const activityTime = new Date(activity.startTime);
      return activityTime >= periodBounds.start && activityTime <= periodBounds.end;
    });
  }, [activities, periodBounds]);
  const reflectionDays = useMemo(
    () => countReflectionDaysInRange(reflections, periodBounds.start, periodBounds.end),
    [periodBounds, reflections],
  );
  const trendDays = period === "weekly" ? differenceInCalendarDays(now, periodBounds.start) + 1 : endOfMonth(now).getDate();
  const trendEnd = period === "weekly" ? now : endOfMonth(now);
  const snapshot = useMemo(
    () => calculateAnalytics(periodActivities, trendDays, trendEnd),
    [periodActivities, trendDays, trendEnd],
  );
  const cards = [
    { label: "Tracked", value: formatDuration(snapshot.totalTrackedSeconds), icon: Clock3 },
    { label: "Deep work", value: formatDuration(snapshot.focusSeconds), icon: Brain },
    { label: "Activities", value: String(snapshot.activityCount), icon: BarChart3 },
    { label: "Reflection days", value: String(reflectionDays), icon: NotebookPen },
  ];

  return (
    <section id="analytics-dashboard" className="space-y-ds-20">
      <div className="dashboard-grid gap-ds-12">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="col-span-12 rounded-lg border border-border bg-surface p-ds-20 sm:col-span-6 xl:col-span-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-label text-text-muted">{card.label}</span>
                <Icon size={18} className="text-interactive-primary" aria-hidden="true" />
              </div>
              <p className="mt-ds-12 text-heading-2 font-[650] tabular-nums text-text-primary">
                {card.value}
              </p>
            </article>
          );
        })}
      </div>
      <div className="grid gap-ds-20 xl:grid-cols-2">
        <article className="rounded-lg border border-border bg-surface p-ds-20">
          <div className="flex flex-col gap-ds-12 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-heading-4 font-semibold text-text-primary">
                {period === "weekly" ? "Weekly Time Tracked" : "Monthly Time Tracked"}
              </h2>
              <p className="mt-ds-4 text-body-sm text-text-muted">
                {period === "weekly"
                  ? "Tracked time across the last seven days."
                  : "Tracked time across the current month."}
              </p>
            </div>
            <div className="flex rounded-md border border-border bg-surface p-ds-4">
              {(["weekly", "monthly"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPeriod(option)}
                  className={
                    period === option
                      ? "rounded-sm bg-surface-active px-ds-12 py-ds-4 text-label font-[550] text-text-primary"
                      : "rounded-sm px-ds-12 py-ds-4 text-label text-text-secondary hover:bg-surface-hover"
                  }
                >
                  {option === "weekly" ? "Weekly" : "Monthly"}
                </button>
              ))}
            </div>
          </div>
          <TrendChart data={snapshot.dailyTrend} period={period} />
        </article>
        <article className="rounded-lg border border-border bg-surface p-ds-20">
          <h2 className="text-heading-4 font-semibold text-text-primary">Category balance</h2>
          <div className="mt-ds-20 space-y-ds-16">
            {snapshot.categoryBreakdown.map((category) => {
              const percentage = snapshot.totalTrackedSeconds
                ? Math.round((category.seconds / snapshot.totalTrackedSeconds) * 100)
                : 0;
              return (
                <div key={category.key}>
                  <div className="mb-ds-4 flex justify-between text-body-sm">
                    <span className="text-text-secondary">{category.name}</span>
                    <span className="tabular-nums text-text-muted">{percentage}%</span>
                  </div>
                  <div className="h-ds-8 overflow-hidden rounded-full bg-surface-subtle">
                    <div
                      className={`h-full rounded-full ${chartStyles[category.key]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {snapshot.categoryBreakdown.length === 0 && (
              <p className="text-body-sm text-text-muted">
                Category patterns will appear after you log time.
              </p>
            )}
          </div>
        </article>
      </div>
      <table className="sr-only">
        <caption>{period === "weekly" ? "Weekly tracked time" : "Monthly tracked time"}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Seconds tracked</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.dailyTrend.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.seconds}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
