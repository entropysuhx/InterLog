"use client";

import { ChevronLeft, ChevronRight, Plus, X, Clock3 } from "lucide-react";
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth, subMonths } from "date-fns";
import { useMemo, useState } from "react";

import CategoryBadge from "@/components/activity/CategoryBadge";
import ActivityEditor from "@/components/activity/ActivityEditor";
import { calculateAnalytics } from "@/lib/analytics/calculate";
import { formatDuration, formatTimeRange, toDateKey } from "@/lib/utils";
import type { ActivityView } from "@/types";

type CalendarViewProps = {
  activities: ActivityView[];
  isAuthenticated?: boolean;
  onChanged?: () => void;
};

export default function CalendarView({
  activities,
  isAuthenticated = false,
  onChanged = () => undefined,
}: CalendarViewProps) {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selectedActivity, setSelectedActivity] = useState<ActivityView | null>(null);
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [selectedDayDetails, setSelectedDayDetails] = useState<Date | null>(null);
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const leading = Array.from({ length: startOfMonth(month).getDay() });

  const monthAnalytics = useMemo(() => calculateAnalytics(activities.filter(a => {
    const d = new Date(a.startTime);
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
  }), 31), [activities, month]);

  const todayAnalytics = useMemo(() => calculateAnalytics(activities.filter(a => isSameDay(new Date(a.startTime), new Date())), 1), [activities]);

  const topMonthCategory = monthAnalytics.categoryBreakdown[0];
  const topTodayCategory = todayAnalytics.categoryBreakdown[0];

  return (
    <section className="rounded-lg border border-border bg-surface p-ds-16">
      <div className="flex items-center justify-between">
        <h2 className="text-heading-3 font-semibold text-text-primary">{format(month, "MMMM yyyy")}</h2>
        <div className="flex gap-ds-4">
          <button
            type="button"
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md bg-interactive-primary px-ds-12 text-label text-text-inverse"
            onClick={() => setCreateDate(new Date())}
          >
            <Plus size={16} aria-hidden="true" />
            Add Activity
          </button>
          <button
            type="button"
            aria-label="Previous month"
            className="flex size-touch-target items-center justify-center rounded-md border border-border"
            onClick={() => setMonth((value) => subMonths(value, 1))}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            className="flex size-touch-target items-center justify-center rounded-md border border-border"
            onClick={() => setMonth((value) => addMonths(value, 1))}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mt-ds-20 flex flex-col gap-ds-12 sm:flex-row">
        <div className="flex-1 rounded-md border border-border bg-surface-subtle p-ds-12">
          <p className="text-label font-[550] text-text-primary">Today</p>
          <p className="mt-ds-4 text-caption text-text-muted">
            You tracked {formatDuration(todayAnalytics.totalTrackedSeconds)} today. 
            {topTodayCategory && ` Most of your time was spent on ${topTodayCategory.name}.`}
          </p>
        </div>
        <div className="flex-1 rounded-md border border-border bg-surface-subtle p-ds-12">
          <p className="text-label font-[550] text-text-primary">This Month</p>
          <p className="mt-ds-4 text-caption text-text-muted">
            This month you tracked {formatDuration(monthAnalytics.totalTrackedSeconds)}. 
            {topMonthCategory && ` You spent ${formatDuration(topMonthCategory.seconds)} on ${topMonthCategory.name}.`}
          </p>
        </div>
      </div>
      <div className="mt-ds-20 grid grid-cols-7 gap-ds-4 text-center text-caption text-text-muted">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="mt-ds-8 grid grid-cols-7 gap-ds-4">
        {leading.map((_, index) => <div key={`leading-${index}`} />)}
        {days.map((day) => {
          const dayActivities = activities.filter(
            (activity) => toDateKey(new Date(activity.startTime)) === toDateKey(day),
          );
          return (
            <div
              key={day.toISOString()}
              className={
                isSameDay(day, new Date())
                  ? "min-h-ds-96 rounded-md border border-border-active bg-surface-active p-ds-4 text-left"
                  : "min-h-ds-96 rounded-md border border-border bg-surface p-ds-4 text-left hover:bg-surface-hover"
              }
            >
              <button
                type="button"
                className="flex min-h-touch-target w-full items-center justify-between rounded-sm px-ds-4 text-left"
                aria-label={`Add activity on ${format(day, "MMMM d")}`}
                onClick={() => setCreateDate(day)}
              >
                <span className="text-caption tabular-nums text-text-secondary">{format(day, "d")}</span>
                <Plus size={14} className="text-text-muted" aria-hidden="true" />
              </button>
              <span className="mt-ds-4 flex flex-col gap-ds-4">
                {dayActivities.slice(0, 2).map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    className="min-h-touch-target rounded-sm px-ds-4 text-left hover:bg-surface-hover"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <span className="block truncate text-caption font-[550] text-text-primary">
                      {activity.title}
                    </span>
                    <CategoryBadge categoryKey={activity.categoryKey} compact />
                  </button>
                ))}
                {dayActivities.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDayDetails(day)}
                    className="min-h-touch-target rounded-sm px-ds-4 text-left hover:bg-surface-hover text-caption text-text-muted font-[550]"
                  >
                    +{dayActivities.length - 2} more
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-ds-16 text-caption text-text-muted">
        Select an activity to edit its title, time, category, notes, or delete it.
      </p>
      <ActivityEditor
        isOpen={Boolean(selectedActivity || createDate)}
        isAuthenticated={isAuthenticated}
        activity={selectedActivity}
        initialStartTime={createDate ? new Date(createDate.getFullYear(), createDate.getMonth(), createDate.getDate(), 9).toISOString() : undefined}
        initialEndTime={createDate ? new Date(createDate.getFullYear(), createDate.getMonth(), createDate.getDate(), 9, 30).toISOString() : undefined}
        onClose={() => {
          setSelectedActivity(null);
          setCreateDate(null);
        }}
        onSaved={onChanged}
      />
      {selectedDayDetails && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-ds-16 backdrop-blur-sm sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedDayDetails(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="day-details-title"
            className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl bg-surface-elevated p-ds-20 shadow-xl animate-in"
          >
            <div className="flex items-center justify-between gap-ds-12 border-b border-border pb-ds-16">
              <div>
                <h2 id="day-details-title" className="text-heading-3 font-semibold text-text-primary">
                  {format(selectedDayDetails, "EEEE, MMMM d")}
                </h2>
                <p className="mt-ds-4 text-body-sm text-text-muted">
                  {activities.filter((a) => toDateKey(new Date(a.startTime)) === toDateKey(selectedDayDetails)).length} activities logged
                </p>
              </div>
              <button
                type="button"
                aria-label="Close day details"
                className="flex size-touch-target items-center justify-center rounded-md text-text-muted hover:bg-surface-hover"
                onClick={() => setSelectedDayDetails(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-ds-16 flex flex-col gap-ds-12">
              {activities
                .filter((a) => toDateKey(new Date(a.startTime)) === toDateKey(selectedDayDetails))
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((activity) => (
                  <article key={activity.id} className="rounded-lg border border-border p-ds-12">
                    <div className="flex items-start justify-between gap-ds-8">
                      <p className="text-label font-[550] text-text-primary">{activity.title}</p>
                      <span className="text-caption tabular-nums text-text-secondary">
                        {formatDuration(activity.duration)}
                      </span>
                    </div>
                    <div className="mt-ds-8 flex items-center gap-ds-8">
                      <CategoryBadge categoryKey={activity.categoryKey} compact />
                      <span className="flex items-center gap-ds-4 text-caption text-text-muted">
                        <Clock3 size={12} aria-hidden="true" />
                        {formatTimeRange(activity.startTime, activity.endTime)}
                      </span>
                    </div>
                    {activity.notes && (
                      <p className="mt-ds-8 text-body-sm text-text-secondary">{activity.notes}</p>
                    )}
                  </article>
                ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
