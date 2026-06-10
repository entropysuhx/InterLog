import type { ActivityView } from "@/types";

export type TimelineActivity = ActivityView & {
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

export function assignLanes(activities: ActivityView[]): TimelineActivity[] {
  const sorted = [...activities].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  const lanes: ActivityView[][] = [];

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

export function getGaps(activities: ActivityView[]): TimelineGap[] {
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
  dayStartHour = 6,
  hourHeight = 80,
): { top: number; height: number } {
  const start = new Date(activity.startTime);
  const startMinutes = (start.getHours() - dayStartHour) * 60 + start.getMinutes();
  const durationMinutes = activity.duration ? activity.duration / 60 : 30;
  return {
    top: (startMinutes / 60) * hourHeight,
    height: Math.max(36, (durationMinutes / 60) * hourHeight),
  };
}

