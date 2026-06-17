"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";

import { useProductData } from "@/components/providers/ProductDataProvider";
import TimelineDetailDialog from "@/components/timeline/TimelineDetailDialog";
import TimelineView from "@/components/timeline/TimelineView";
import { formatDuration, toDateKey } from "@/lib/utils";
import type { ActivityView } from "@/types";

function groupActivitiesByDate(activityList: ActivityView[]) {
  const grouped = activityList.reduce<
    Record<string, { count: number; duration: number; date: Date; activities: ActivityView[] }>
  >((acc, activity) => {
    const dateKey = toDateKey(new Date(activity.startTime));
    acc[dateKey] ??= {
      count: 0,
      duration: 0,
      date: new Date(activity.startTime),
      activities: [],
    };
    acc[dateKey].count += 1;
    acc[dateKey].duration += activity.duration ?? 0;
    acc[dateKey].activities.push(activity);
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());
}

function getTotalSeconds(activities: ActivityView[]) {
  return activities.reduce((total, activity) => total + (activity.duration ?? 0), 0);
}

export default function TimelinePage() {
  const { activities, isAuthenticated, isReady, refresh } = useProductData();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [detail, setDetail] = useState<{
    title: string;
    description?: string;
    activities: ActivityView[];
    groupByDay?: boolean;
  } | null>(null);

  const weeklyActivities = useMemo(() => {
    const start = startOfWeek(date);
    const end = endOfWeek(date);
    return activities.filter((activity) =>
      isWithinInterval(new Date(activity.startTime), { start, end }),
    );
  }, [activities, date]);

  const monthlyActivities = useMemo(() => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return activities.filter((activity) =>
      isWithinInterval(new Date(activity.startTime), { start, end }),
    );
  }, [activities, date]);

  const weeklyGrouped = useMemo(() => groupActivitiesByDate(weeklyActivities), [weeklyActivities]);
  const monthlyGrouped = useMemo(() => groupActivitiesByDate(monthlyActivities), [monthlyActivities]);

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
                  subDays(current, view === "monthly" ? 30 : view === "weekly" ? 7 : 1),
                )
              }
              className="flex min-h-touch-target items-center gap-ds-8 rounded-md px-ds-12 text-label text-text-secondary hover:bg-surface-hover"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setDate(new Date())}
              className="text-label font-[550] text-text-primary hover:underline"
            >
              {view === "daily" ? "Today" : view === "weekly" ? "This Week" : "This Month"}
            </button>
            <button
              type="button"
              onClick={() =>
                setDate((current) =>
                  addDays(current, view === "monthly" ? 30 : view === "weekly" ? 7 : 1),
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
                Week of {format(startOfWeek(date), "MMM d")}
              </h2>
              <p className="mb-ds-16 text-body-sm text-text-secondary">
                You logged {weeklyActivities.length} activities totaling{" "}
                {formatDuration(getTotalSeconds(weeklyActivities))} this week.
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
                You logged {monthlyActivities.length} activities totaling{" "}
                {formatDuration(getTotalSeconds(monthlyActivities))} this month.
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
