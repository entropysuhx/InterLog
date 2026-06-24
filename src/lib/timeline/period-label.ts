import {
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  format,
  isSameMonth,
  startOfDay,
  startOfWeek,
} from "date-fns";

type TimelineView = "daily" | "weekly" | "monthly";
type WeekStartsOn = 0 | 1;

export function getTimelinePeriodLabel(
  view: TimelineView,
  selectedDate: Date,
  weekStartsOn: WeekStartsOn,
  referenceDate = new Date(),
) {
  const today = startOfDay(referenceDate);

  if (view === "daily") {
    const dayDifference = differenceInCalendarDays(startOfDay(selectedDate), today);

    if (dayDifference === 0) return "Today";
    if (dayDifference === -1) return "Yesterday";
    if (dayDifference === 1) return "Tomorrow";

    return format(selectedDate, "EEEE, MMMM d, yyyy");
  }

  if (view === "weekly") {
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn });
    const currentWeekStart = startOfWeek(today, { weekStartsOn });
    const weekDifference = differenceInCalendarWeeks(selectedWeekStart, currentWeekStart, {
      weekStartsOn,
    });

    if (weekDifference === 0) return "This Week";
    if (weekDifference === -1) return "Last Week";
    if (weekDifference === 1) return "Next Week";

    return `Week of ${format(selectedWeekStart, "MMM d, yyyy")}`;
  }

  return isSameMonth(selectedDate, today) ? "This Month" : format(selectedDate, "MMMM yyyy");
}
