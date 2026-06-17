"use client";

import { Clock3, X } from "lucide-react";
import { format } from "date-fns";
import { useMemo } from "react";

import CategoryBadge from "@/components/activity/CategoryBadge";
import ModalShell from "@/components/layout/ModalShell";
import { formatDuration, formatTimeRange, toDateKey } from "@/lib/utils";
import type { ActivityView } from "@/types";

type TimelineDetailDialogProps = {
  title: string;
  description?: string;
  activities: ActivityView[];
  groupByDay?: boolean;
  onClose: () => void;
};

function getTotalSeconds(activities: ActivityView[]) {
  return activities.reduce((total, activity) => total + (activity.duration ?? 0), 0);
}

export default function TimelineDetailDialog({
  title,
  description,
  activities,
  groupByDay = false,
  onClose,
}: TimelineDetailDialogProps) {
  const groupedActivities = useMemo(() => {
    const grouped = activities.reduce<Record<string, ActivityView[]>>((groups, activity) => {
      const key = toDateKey(new Date(activity.startTime));
      groups[key] = [...(groups[key] ?? []), activity];
      return groups;
    }, {});

    return Object.entries(grouped)
      .map(([dateKey, dayActivities]) => ({
        dateKey,
        date: new Date(`${dateKey}T00:00:00`),
        activities: dayActivities.sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activities]);

  return (
    <ModalShell titleId="timeline-detail-title" onClose={onClose}>
      <div className="flex items-start justify-between gap-ds-12 border-b border-border pb-ds-16">
        <div>
          <h2 id="timeline-detail-title" className="text-heading-3 font-semibold text-text-primary">
            {title}
          </h2>
          {description && <p className="mt-ds-4 text-body-sm text-text-secondary">{description}</p>}
          <p className="mt-ds-8 text-caption tabular-nums text-text-muted">
            {activities.length} activities / {formatDuration(getTotalSeconds(activities))} tracked
          </p>
        </div>
        <button
          type="button"
          aria-label="Close timeline details"
          className="flex size-touch-target items-center justify-center rounded-md text-text-muted hover:bg-surface-hover"
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-ds-16 space-y-ds-16">
        {groupedActivities.map((group) => (
          <section key={group.dateKey}>
            {groupByDay && (
              <h3 className="mb-ds-8 text-label font-[550] text-text-secondary">
                {format(group.date, "EEEE, MMM d")}
              </h3>
            )}
            <div className="space-y-ds-12">
              {group.activities.map((activity) => (
                <article
                  key={activity.id}
                  className="rounded-lg border border-border bg-surface p-ds-12"
                >
                  <div className="flex items-start justify-between gap-ds-12">
                    <div className="min-w-0">
                      <h4 className="truncate text-label font-[550] text-text-primary">
                        {activity.title}
                      </h4>
                      <div className="mt-ds-8 flex flex-wrap items-center gap-ds-8">
                        <CategoryBadge categoryKey={activity.categoryKey} compact />
                        <span className="flex items-center gap-ds-4 text-caption text-text-muted">
                          <Clock3 size={12} aria-hidden="true" />
                          {formatTimeRange(activity.startTime, activity.endTime)}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-caption tabular-nums text-text-secondary">
                      {formatDuration(activity.duration)}
                    </span>
                  </div>
                  {activity.notes && (
                    <p className="mt-ds-8 whitespace-pre-wrap text-body-sm text-text-secondary">
                      {activity.notes}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
        {activities.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-ds-20 text-center text-body-sm text-text-secondary">
            No activities were logged for this period.
          </p>
        )}
      </div>
    </ModalShell>
  );
}
