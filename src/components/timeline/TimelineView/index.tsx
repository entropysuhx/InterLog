"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";

import TimelineItem from "@/components/timeline/TimelineItem";
import ActivityEditor from "@/components/activity/ActivityEditor";
import { assignLanes, getBlockMetrics, getGaps } from "@/lib/timeline/layout";
import { toDateKey } from "@/lib/utils";
import type { ActivityView } from "@/types";

type TimelineViewProps = {
  activities: ActivityView[];
  date?: Date;
  onLogGap?: (startTime: string, endTime: string) => void;
  isAuthenticated?: boolean;
  onChanged?: () => void;
  showActions?: boolean;
};

export default function TimelineView({
  activities,
  date = new Date(),
  onLogGap,
  isAuthenticated = false,
  onChanged = () => undefined,
  showActions = true,
}: TimelineViewProps) {
  const [now, setNow] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState<ActivityView | null>(null);
  const [createRange, setCreateRange] = useState<{ start: string; end: string | null } | null>(null);
  const dateKey = toDateKey(date);
  const dayActivities = useMemo(
    () =>
      activities
        .filter((activity) => toDateKey(new Date(activity.startTime)) === dateKey)
        .map((activity) => activity),
    [activities, dateKey],
  );
  const laneActivities = useMemo(() => assignLanes(dayActivities), [dayActivities]);
  const gaps = useMemo(() => getGaps(dayActivities), [dayActivities]);
  const hours = Array.from({ length: 19 }, (_, index) => index + 6); // 6 AM → midnight

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const nowTop = ((now.getHours() - 6) * 60 + now.getMinutes()) * (80 / 60);

  return (
    <section id="timeline-view" className="rounded-lg border border-border bg-surface p-ds-12">
      <div className="mb-ds-12 flex items-center justify-between">
        <div>
          <h2 className="text-heading-4 font-semibold text-text-primary">
            {isSameDay(date, new Date()) ? "Today" : format(date, "EEEE")}
          </h2>
          <p className="text-caption text-text-muted">{date.toLocaleDateString(undefined, { dateStyle: "full" })}</p>
        </div>
        <div className="flex items-center gap-ds-8">
          <span className="text-caption text-text-muted">{dayActivities.length} activities</span>
          {showActions && (
            <button
              type="button"
              className="flex min-h-touch-target items-center gap-ds-8 rounded-md bg-interactive-primary px-ds-12 text-label text-text-inverse"
              onClick={() => {
                const end = new Date();
                const start = new Date(end.getTime() - 30 * 60 * 1000);
                setCreateRange({ start: start.toISOString(), end: end.toISOString() });
              }}
            >
              <Plus size={16} aria-hidden="true" />
              Add Activity
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-[var(--spacing-timeline-axis)_minmax(0,1fr)]">
        <div aria-hidden="true" className="relative" style={{ minHeight: hours.length * 80 }}>
          {hours.map((hour) => (
            <span
              key={hour}
              className="absolute right-ds-8 text-caption tabular-nums text-text-muted"
              style={{ top: (hour - 6) * 80 - 7 }}
            >
              {new Date(2020, 0, 1, hour).toLocaleTimeString([], { hour: "numeric" })}
            </span>
          ))}
        </div>
        <div
          className="relative overflow-visible rounded-md bg-surface-subtle pb-ds-16"
          style={{ minHeight: hours.length * 80 }}
        >
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-border"
              style={{ top: (hour - 6) * 80 }}
            />
          ))}
          {dateKey === toDateKey(new Date()) && nowTop >= 0 && nowTop <= 1280 && (
            <div className="pointer-events-none absolute left-0 right-0 z-raised border-t-2 border-border-active" style={{ top: nowTop }}>
              <span className="absolute -top-ds-8 left-ds-4 rounded-full bg-interactive-primary px-ds-4 text-caption tabular-nums text-text-inverse">
                {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          )}
          {gaps.map((gap) => {
            const metrics = getBlockMetrics(
              {
                ...dayActivities[0],
                id: gap.startTime,
                title: "Gap",
                startTime: gap.startTime,
                endTime: gap.endTime,
                duration: gap.durationMinutes * 60,
              } as ActivityView,
            );
            return (
              <button
                key={gap.startTime}
                type="button"
                aria-label={`Log activity from ${new Date(gap.startTime).toLocaleTimeString()} to ${new Date(gap.endTime).toLocaleTimeString()}`}
                className="absolute left-ds-4 right-ds-4 flex items-center justify-center rounded-md border border-dashed border-border-hover text-caption text-text-muted opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
                style={{ top: metrics.top, height: Math.max(36, metrics.height) }}
                onClick={() => {
                  onLogGap?.(gap.startTime, gap.endTime);
                  setCreateRange({ start: gap.startTime, end: gap.endTime });
                }}
              >
                <Plus size={14} aria-hidden="true" />
                Log this time
              </button>
            );
          })}
          {laneActivities.map((activity) => {
            const metrics = getBlockMetrics(activity);
            return (
              <TimelineItem
                key={activity.id}
                activity={activity}
                {...metrics}
                onEdit={(item) => setSelectedActivity(item)}
              />
            );
          })}
          {dayActivities.length === 0 && (
            <div className="absolute inset-x-ds-16 top-ds-32 rounded-lg border border-dashed border-border p-ds-24 text-center">
              <p className="text-body-sm text-text-secondary">Log an activity to begin today&apos;s timeline.</p>
            </div>
          )}
        </div>
      </div>
      <ActivityEditor
        isOpen={Boolean(selectedActivity || createRange)}
        isAuthenticated={isAuthenticated}
        activity={selectedActivity}
        initialStartTime={createRange?.start}
        initialEndTime={createRange?.end}
        onClose={() => {
          setSelectedActivity(null);
          setCreateRange(null);
        }}
        onSaved={onChanged}
      />
    </section>
  );
}
