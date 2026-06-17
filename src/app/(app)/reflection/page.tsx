"use client";

import { useState } from "react";
import { BookOpen, CalendarClock, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import ReflectionCard from "@/components/reflection/ReflectionCard";
import TimelineView from "@/components/timeline/TimelineView";
import { useProductData } from "@/components/providers/ProductDataProvider";
import { toDateKey } from "@/lib/utils";

export default function ReflectionPage() {
  const { activities, reflections, reflectionDays, isAuthenticated, isReady, refresh } =
    useProductData();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const selectedDateKey = toDateKey(currentDate);
  const todayKey = toDateKey(new Date());
  const isTodaySelected = selectedDateKey === todayKey;
  const isFutureSelected = selectedDateKey > todayKey;
  const [isWritingReflection, setIsWritingReflection] = useState(false);

  // Filter activities for the selected date
  const selectedDayActivities = activities.filter(
    (activity) => toDateKey(new Date(activity.startTime)) === selectedDateKey,
  );

  // Filter reflections for the selected date
  const selectedDayReflections = reflections.filter(
    (reflection) => reflection.activityDate === selectedDateKey,
  );

  const hasReflection = selectedDayReflections.length > 0;

  function handleNavigate(days: number) {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      setIsWritingReflection(false);
      return d;
    });
  }

  return (
    <div className="space-y-ds-24">
      <header className="flex flex-wrap items-center justify-between gap-ds-16">
        <div>
          <h1 className="text-heading-2 font-[650] text-text-primary">Reflection</h1>
          <p className="mt-ds-4 text-body-sm text-text-secondary">
            {reflectionDays} reflection days.
          </p>
        </div>
        <div className="flex items-center gap-ds-8">
          <button
            type="button"
            onClick={() => handleNavigate(-1)}
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border bg-surface px-ds-12 text-label text-text-secondary hover:bg-surface-hover"
            aria-label="Previous day"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Previous Day
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentDate(new Date());
              setIsWritingReflection(false);
            }}
            disabled={isTodaySelected}
            className="flex min-h-touch-target items-center rounded-md border border-border bg-surface px-ds-16 text-label text-text-secondary hover:bg-surface-hover disabled:opacity-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleNavigate(1)}
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border bg-surface px-ds-12 text-label text-text-secondary hover:bg-surface-hover"
            aria-label="Next day"
          >
            Next Day
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between border-b border-border pb-ds-12">
        <h2 className="text-heading-4 font-semibold text-text-primary">
          {isTodaySelected
            ? "Today"
            : currentDate.toLocaleDateString(undefined, { dateStyle: "full" })}
        </h2>
      </div>

      {isReady ? (
        <div className="grid gap-ds-20 xl:grid-cols-2">
          {hasReflection ? (
            <ReflectionCard
              activities={selectedDayActivities}
              date={selectedDateKey}
              isAuthenticated={isAuthenticated}
              savedReflections={selectedDayReflections}
              onSaved={refresh}
            />
          ) : isWritingReflection && !isFutureSelected ? (
            <ReflectionCard
              activities={selectedDayActivities}
              date={selectedDateKey}
              isAuthenticated={isAuthenticated}
              savedReflections={selectedDayReflections}
              onSaved={refresh}
            />
          ) : (
            <article className="flex min-h-panel-sm flex-col items-center justify-start rounded-xl border border-border bg-surface p-ds-24 pt-ds-40 text-center">
              <span className="flex size-ds-48 items-center justify-center rounded-full bg-surface-subtle text-interactive-primary">
                {isFutureSelected ? (
                  <CalendarClock size={22} aria-hidden="true" />
                ) : isTodaySelected ? (
                  <Sparkles size={22} aria-hidden="true" />
                ) : (
                  <BookOpen size={22} aria-hidden="true" />
                )}
              </span>
              <h3 className="mt-ds-16 text-heading-4 font-semibold text-text-primary">
                {isFutureSelected
                  ? "This day hasn't happened yet"
                  : isTodaySelected
                    ? "Take a moment to reflect"
                    : "No reflection recorded"}
              </h3>
              <p className="mt-ds-8 max-w-reading text-body-sm text-text-secondary">
                {isFutureSelected
                  ? "You haven't lived this day yet. Come back later to reflect on how it went."
                  : isTodaySelected
                    ? "What stood out today? What would you like to remember?"
                    : "You didn't write a reflection for this day. Your activities are still part of your story, even when you don't pause to write about them."}
              </p>
              {!isFutureSelected && (
                <button
                  type="button"
                  onClick={() => setIsWritingReflection(true)}
                  className="mt-ds-20 min-h-touch-target rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse hover:bg-interactive-primary-hover"
                >
                  {isTodaySelected ? "Start Reflection" : "Write Reflection"}
                </button>
              )}
            </article>
          )}
          <TimelineView activities={activities} date={currentDate} showActions={false} />
        </div>
      ) : (
        <div className="min-h-panel-lg animate-pulse rounded-lg bg-surface-subtle" />
      )}
    </div>
  );
}
