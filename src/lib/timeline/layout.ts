import { addDays, startOfDay } from "date-fns";

import { calculateDuration, toDateKey } from "@/lib/utils";
import type { ActivityView } from "@/types";

export type TimelineDisplayActivity = ActivityView & {
  sourceActivity: ActivityView;
  isInProgress: boolean;
  continuesFromPreviousDay: boolean;
  continuesIntoNextDay: boolean;
};

export type TimelineActivity<T extends ActivityView = ActivityView> = T & {
  laneIndex: number;
  totalLanes: number;
};

export type TimelineGap = {
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

function effectiveEnd(activity: ActivityView): number {
  return new Date(activity.endTime ?? activity.startTime).getTime();
}

/** Returns the portion of each activity that belongs to the selected local calendar day. */
export function getTimelineActivitiesForDate(
  activities: ActivityView[],
  date: Date,
  now = new Date(),
): TimelineDisplayActivity[] {
  const dayStart = startOfDay(date);
  const nextDayStart = addDays(dayStart, 1);

  return activities.flatMap((activity) => {
    const originalStart = new Date(activity.startTime);
    const originalEnd = activity.endTime ? new Date(activity.endTime) : now;

    if (originalStart >= nextDayStart || originalEnd <= dayStart) return [];

    const segmentStart = originalStart > dayStart ? originalStart : dayStart;
    const segmentEnd = originalEnd < nextDayStart ? originalEnd : nextDayStart;

    return [
      {
        ...activity,
        id: `${activity.id}:${toDateKey(dayStart)}`,
        startTime: segmentStart.toISOString(),
        endTime: segmentEnd.toISOString(),
        duration: calculateDuration(segmentStart, segmentEnd),
        sourceActivity: activity,
        isInProgress: activity.endTime === null,
        continuesFromPreviousDay: originalStart < dayStart,
        continuesIntoNextDay: originalEnd > nextDayStart,
      },
    ];
  });
}

export function assignLanes<T extends ActivityView>(activities: T[]): TimelineActivity<T>[] {
  const sorted = [...activities].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  const lanes: T[][] = [];

  for (const activity of sorted) {
    const start = new Date(activity.startTime).getTime();
    const laneIndex = lanes.findIndex((lane) => effectiveEnd(lane[lane.length - 1]) <= start);
    if (laneIndex === -1) lanes.push([activity]);
    else lanes[laneIndex].push(activity);
  }

  return lanes.flatMap((lane, laneIndex) =>
    lane.map((activity) => ({ ...activity, laneIndex, totalLanes: lanes.length })),
  );
}

export function getGaps<T extends ActivityView>(activities: T[]): TimelineGap[] {
  const sorted = [...activities]
    .filter((activity) => activity.endTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const gaps: TimelineGap[] = [];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const start = new Date(sorted[index].endTime as string);
    const end = new Date(sorted[index + 1].startTime);
    const durationMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    if (durationMinutes >= 45) {
      gaps.push({ startTime: start.toISOString(), endTime: end.toISOString(), durationMinutes });
    }
  }
  return gaps;
}

export function getBlockMetrics(
  activity: ActivityView,
  dayStartHour = 0,
  hourHeight = 80,
): { top: number; height: number } {
  const start = new Date(activity.startTime);
  const end = activity.endTime ? new Date(activity.endTime) : null;
  const dayEnd = new Date(start);
  dayEnd.setHours(24, 0, 0, 0);
  const visibleEnd = end && end > dayEnd ? dayEnd : end;
  const startMinutes = (start.getHours() - dayStartHour) * 60 + start.getMinutes();
  const durationMinutes = visibleEnd
    ? Math.max(1, (visibleEnd.getTime() - start.getTime()) / 60000)
    : 30;
  const rawTop = (startMinutes / 60) * hourHeight;
  const dayEndTop = (24 - dayStartHour) * hourHeight;
  const height = Math.max(36, (durationMinutes / 60) * hourHeight);
  return {
    top: Math.max(0, Math.min(rawTop, dayEndTop - height)),
    height: Math.min(height, dayEndTop),
  };
}
