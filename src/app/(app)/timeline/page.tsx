"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns";

import TimelineView from "@/components/timeline/TimelineView";
import { useProductData } from "@/components/providers/ProductDataProvider";
import type { ActivityView } from "@/types";

function groupActivitiesByDate(activityList: ActivityView[]) {
  const grouped = activityList.reduce((acc, a) => {
    const d = format(new Date(a.startTime), "yyyy-MM-dd");
    if (!acc[d]) acc[d] = { count: 0, duration: 0, date: new Date(a.startTime) };
    acc[d].count += 1;
    acc[d].duration += a.duration ?? 0;
    return acc;
  }, {} as Record<string, { count: number; duration: number; date: Date }>);
  return Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());
}

export default function TimelinePage() {
  const { activities, isAuthenticated, isReady, refresh } = useProductData();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");

  const weeklyActivities = useMemo(() => {
    const start = startOfWeek(date);
    const end = endOfWeek(date);
    return activities.filter((a) => isWithinInterval(new Date(a.startTime), { start, end }));
  }, [activities, date]);

  const monthlyActivities = useMemo(() => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return activities.filter((a) => isWithinInterval(new Date(a.startTime), { start, end }));
  }, [activities, date]);

  const weeklyGrouped = useMemo(() => groupActivitiesByDate(weeklyActivities), [weeklyActivities]);
  const monthlyGrouped = useMemo(() => groupActivitiesByDate(monthlyActivities), [monthlyActivities]);
  return (
    <div className="space-y-ds-20">
      <header className="flex flex-col gap-ds-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-heading-2 font-[650] text-text-primary">Timeline</h1>
          <p className="mt-ds-4 text-body-sm text-text-secondary">A chronological view of what actually happened.</p>
        </div>
        <div className="flex gap-ds-4">
           <div className="flex rounded-md border border-border bg-surface p-ds-4">
             <button type="button" onClick={() => setView("daily")} className={view === "daily" ? "rounded-sm bg-surface-active px-ds-12 py-ds-4 text-label font-[550] text-text-primary" : "rounded-sm px-ds-12 py-ds-4 text-label text-text-secondary hover:bg-surface-hover"}>Daily</button>
             <button type="button" onClick={() => setView("weekly")} className={view === "weekly" ? "rounded-sm bg-surface-active px-ds-12 py-ds-4 text-label font-[550] text-text-primary" : "rounded-sm px-ds-12 py-ds-4 text-label text-text-secondary hover:bg-surface-hover"}>Weekly</button>
             <button type="button" onClick={() => setView("monthly")} className={view === "monthly" ? "rounded-sm bg-surface-active px-ds-12 py-ds-4 text-label font-[550] text-text-primary" : "rounded-sm px-ds-12 py-ds-4 text-label text-text-secondary hover:bg-surface-hover"}>Monthly</button>
           </div>
        </div>
      </header>
      {isReady ? (
        <div className="space-y-ds-16">
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-ds-12">
             <button type="button" onClick={() => setDate(d => subDays(d, view === "monthly" ? 30 : view === "weekly" ? 7 : 1))} className="flex min-h-touch-target items-center gap-ds-8 rounded-md px-ds-12 text-label text-text-secondary hover:bg-surface-hover"><ChevronLeft size={16} /> Previous</button>
             <button type="button" onClick={() => setDate(new Date())} className="text-label font-[550] text-text-primary hover:underline">
               {view === "daily" ? "Today" : view === "weekly" ? "This Week" : "This Month"}
             </button>
             <button type="button" onClick={() => setDate(d => addDays(d, view === "monthly" ? 30 : view === "weekly" ? 7 : 1))} className="flex min-h-touch-target items-center gap-ds-8 rounded-md px-ds-12 text-label text-text-secondary hover:bg-surface-hover">Next <ChevronRight size={16} /></button>
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
              <h2 className="text-heading-4 font-semibold text-text-primary mb-ds-16">Week of {format(startOfWeek(date), "MMM d")}</h2>
              <p className="text-body-sm text-text-secondary mb-ds-16">
                You logged {weeklyActivities.length} activities totaling {Math.round(weeklyActivities.reduce((acc, a) => acc + (a.duration ?? 0), 0) / 60)} minutes this week.
              </p>
              <div className="space-y-ds-8">
                {weeklyGrouped.map((day) => (
                  <div key={day.date.toISOString()} className="flex items-center justify-between rounded-md bg-surface-subtle p-ds-12 text-sm text-text-primary">
                    <span className="font-[550]">{format(day.date, "EEEE, MMM d")}</span>
                    <span className="text-caption tabular-nums text-text-secondary">
                      {day.count} activities · {Math.round(day.duration / 60)} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {view === "monthly" && (
            <div className="rounded-lg border border-border bg-surface p-ds-16">
              <h2 className="text-heading-4 font-semibold text-text-primary mb-ds-16">{format(date, "MMMM yyyy")}</h2>
              <p className="text-body-sm text-text-secondary mb-ds-16">
                You logged {monthlyActivities.length} activities totaling {Math.round(monthlyActivities.reduce((acc, a) => acc + (a.duration ?? 0), 0) / 60)} minutes this month.
              </p>
              <div className="space-y-ds-8">
                {monthlyGrouped.map((day) => (
                  <div key={day.date.toISOString()} className="flex items-center justify-between rounded-md bg-surface-subtle p-ds-12 text-sm text-text-primary">
                    <span className="font-[550]">{format(day.date, "MMM d")}</span>
                    <span className="text-caption tabular-nums text-text-secondary">
                      {day.count} activities · {Math.round(day.duration / 60)} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : <div className="min-h-panel-lg animate-pulse rounded-lg bg-surface-subtle" />}
    </div>
  );
}
