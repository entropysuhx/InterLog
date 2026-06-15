"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ReflectionCard from "@/components/reflection/ReflectionCard";
import TimelineView from "@/components/timeline/TimelineView";
import { useProductData } from "@/components/providers/ProductDataProvider";
import { toDateKey } from "@/lib/utils";

export default function ReflectionPage() {
  const { activities, reflections, reflectionDays, isAuthenticated, isReady, refresh } = useProductData();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const selectedDateKey = toDateKey(currentDate);
  const isTodaySelected = selectedDateKey === toDateKey(new Date());

  // Filter activities for the selected date
  const selectedDayActivities = activities.filter(
    (activity) => toDateKey(new Date(activity.startTime)) === selectedDateKey
  );

  // Filter reflections for the selected date
  const selectedDayReflections = reflections.filter(
    (reflection) => reflection.activityDate === selectedDateKey
  );

  const hasReflection = selectedDayReflections.length > 0;

  function handleNavigate(days: number) {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      return d;
    });
  }

  return (
    <div className="space-y-ds-24">
      <header className="flex flex-wrap items-center justify-between gap-ds-16">
        <div>
          <h1 className="text-heading-2 font-[650] text-text-primary">Reflection</h1>
          <p className="mt-ds-4 text-body-sm text-text-secondary">{reflectionDays} reflection days.</p>
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
            onClick={() => setCurrentDate(new Date())}
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
          {isTodaySelected ? "Today" : currentDate.toLocaleDateString(undefined, { dateStyle: "full" })}
        </h2>
      </div>

      {isReady ? (
        <div className="grid gap-ds-20 xl:grid-cols-2">
          {hasReflection || isTodaySelected ? (
            <ReflectionCard
              activities={selectedDayActivities}
              date={selectedDateKey}
              isAuthenticated={isAuthenticated}
              savedReflections={selectedDayReflections}
              onSaved={refresh}
            />
          ) : (
            <article className="rounded-xl border border-border bg-surface p-ds-20 flex flex-col justify-center items-center text-center min-h-[300px]">
              <p className="text-body-md text-text-secondary font-[550]">No reflection saved for this day yet.</p>
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
