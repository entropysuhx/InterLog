"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth, subMonths } from "date-fns";
import { useState } from "react";

import CategoryBadge from "@/components/activity/CategoryBadge";
import ActivityEditor from "@/components/activity/ActivityEditor";
import { toDateKey } from "@/lib/utils";
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
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const leading = Array.from({ length: startOfMonth(month).getDay() });

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
                  <span className="text-caption text-text-muted">+{dayActivities.length - 2} more</span>
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
    </section>
  );
}
