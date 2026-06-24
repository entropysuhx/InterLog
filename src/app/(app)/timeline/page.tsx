"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subDays,
} from "date-fns";

import { useProductData } from "@/components/providers/ProductDataProvider";
import TimelineDetailDialog from "@/components/timeline/TimelineDetailDialog";
import { getTimelineActivitiesForDate } from "@/lib/timeline/layout";
import { getTimelinePeriodLabel } from "@/lib/timeline/period-label";
import TimelineView from "@/components/timeline/TimelineView";
import { formatDuration } from "@/lib/utils";
import type { ActivityView } from "@/types";

function groupActivitiesByDate(activityList: ActivityView[], start: Date, end: Date) {
  return eachDayOfInterval({ start, end })
    .map((date) => {
      const activities = getTimelineActivitiesForDate(activityList, date);
      return {
        count: activities.length,
        duration: getTotalSeconds(activities),
        date,
        activities,
      };
    })
    .filter((day) => day.count > 0)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

function getTotalSeconds(activities: ActivityView[]) {
  return activities.reduce((total, activity) => total + (activity.duration ?? 0), 0);
}

export default function TimelinePage() {
  const { activities, isAuthenticated, isReady, refresh, weekStartsOn } = useProductData();
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [detail, setDetail] = useState<{
    title: string;
    description?: string;
    activities: ActivityView[];
    groupByDay?: boolean;
  } | null>(null);

  const weeklyStart = startOfWeek(date, { weekStartsOn });
  const weeklyEnd = endOfWeek(date, { weekStartsOn });
  const monthlyStart = startOfMonth(date);
  const monthlyEnd = endOfMonth(date);
  const periodLabel = getTimelinePeriodLabel(view, date, weekStartsOn);
  const weeklyGrouped = useMemo(
    () => groupActivitiesByDate(activities, weeklyStart, weeklyEnd),
    [activities, weeklyStart, weeklyEnd],
  );
  const monthlyGrouped = useMemo(
    () => groupActivitiesByDate(activities, monthlyStart, monthlyEnd),
    [activities, monthlyStart, monthlyEnd],
  );
  const weeklyDuration = useMemo(
    () => getTotalSeconds(weeklyGrouped.flatMap((day) => day.activities)),
    [weeklyGrouped],
  );
  const monthlyDuration = useMemo(
    () => getTotalSeconds(monthlyGrouped.flatMap((day) => day.activities)),
    [monthlyGrouped],
  );
  const weeklyActivityCount = useMemo(
    () => weeklyGrouped.reduce((total, day) => total + day.count, 0),
    [weeklyGrouped],
  );
  const monthlyActivityCount = useMemo(
    () => monthlyGrouped.reduce((total, day) => total + day.count, 0),
    [monthlyGrouped],
  );

  return (
    <div className="space-y-ds-20">
      <header className="flex flex-col gap-ds-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-heading-2 font-[650] text-text-primary">Timeline</h1>
          <p className="mt-ds-4 text-body-sm text-text-secondary">
            A chronological view of what actually happened.
          </p>
        </div>
        <div className="flex rounded-md border border-border bg-surface p-ds-4">
          {(["daily", "weekly", "monthly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className={
                view === option
                  ? "rounded-sm bg-surface-active px-ds-12 py-ds-4 text-label font-[550] text-text-primary"
                  : "rounded-sm px-ds-12 py-ds-4 text-label text-text-secondary hover:bg-surface-hover"
              }
            >
              {option === "daily" ? "Daily" : option === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </header>

      {isReady ? (
        <div className="space-y-ds-16">
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-ds-12">
            <button
              type="button"
              onClick={() =>
                setDate((current) =>
                  view === "monthly"
                    ? subMonths(current, 1)
                    : subDays(current, view === "weekly" ? 7 : 1),
                )
              }
              className="flex min-h-touch-target items-center gap-ds-8 rounded-md px-ds-12 text-label text-text-secondary hover:bg-surface-hover"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setDate(startOfDay(new Date()))}
              className="text-label font-[550] text-text-primary hover:underline"
            >
              {periodLabel}
            </button>
            <button
              type="button"
              onClick={() =>
                setDate((current) =>
                  view === "monthly"
                    ? addMonths(current, 1)
                    : addDays(current, view === "weekly" ? 7 : 1),
                )
              }
              className="flex min-h-touch-target items-center gap-ds-8 rounded-md px-ds-12 text-label text-text-secondary hover:bg-surface-hover"
            >
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>

          {view === "daily" && (
            <TimelineView
              activities={activities}
              date={date}
              isAuthenticated={isAuthenticated}
              onChanged={refresh}
            />
          )}

          {view === "weekly" && (
            <div className="rounded-lg border border-border bg-surface p-ds-16">
              <h2 className="mb-ds-16 text-heading-4 font-semibold text-text-primary">
                Week of {format(weeklyStart, "MMM d")}
              </h2>
              <p className="mb-ds-16 text-body-sm text-text-secondary">
                You logged {weeklyActivityCount} activities totaling{" "}
                {formatDuration(weeklyDuration)} this week.
              </p>
              <div className="space-y-ds-8">
                {weeklyGrouped.map((day) => (
                  <button
                    key={day.date.toISOString()}
                    type="button"
                    className="flex min-h-touch-target w-full items-center justify-between rounded-md bg-surface-subtle p-ds-12 text-left text-body-sm text-text-primary hover:bg-surface-hover"
                    onClick={() =>
                      setDetail({
                        title: format(day.date, "EEEE, MMMM d"),
                        description: "Activities logged on this day.",
                        activities: day.activities,
                      })
                    }
                  >
                    <span className="font-[550]">{format(day.date, "EEEE, MMM d")}</span>
                    <span className="text-caption tabular-nums text-text-secondary">
                      {day.count} activities · {formatDuration(day.duration)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === "monthly" && (
            <div className="rounded-lg border border-border bg-surface p-ds-16">
              <h2 className="mb-ds-16 text-heading-4 font-semibold text-text-primary">
                {format(date, "MMMM yyyy")}
              </h2>
              <p className="mb-ds-16 text-body-sm text-text-secondary">
                You logged {monthlyActivityCount} activities totaling{" "}
                {formatDuration(monthlyDuration)} this month.
              </p>
              <div className="space-y-ds-8">
                {monthlyGrouped.map((day) => (
                  <button
                    key={day.date.toISOString()}
                    type="button"
                    className="flex min-h-touch-target w-full items-center justify-between rounded-md bg-surface-subtle p-ds-12 text-left text-body-sm text-text-primary hover:bg-surface-hover"
                    onClick={() =>
                      setDetail({
                        title: format(day.date, "EEEE, MMMM d"),
                        description: `Timeline detail for ${format(day.date, "MMMM yyyy")}.`,
                        activities: day.activities,
                        groupByDay: true,
                      })
                    }
                  >
                    <span className="font-[550]">{format(day.date, "MMM d")}</span>
                    <span className="text-caption tabular-nums text-text-secondary">
                      {day.count} activities · {formatDuration(day.duration)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-panel-lg animate-pulse rounded-lg bg-surface-subtle" />
      )}

      {detail && (
        <TimelineDetailDialog
          title={detail.title}
          description={detail.description}
          activities={detail.activities}
          groupByDay={detail.groupByDay}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
