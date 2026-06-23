"use client";

import CalendarView from "@/components/calendar/CalendarView";
import { useProductData } from "@/components/providers/ProductDataProvider";

export default function CalendarPage() {
  const { activities, isAuthenticated, isReady, refresh, weekStartsOn } = useProductData();
  return (
    <div className="space-y-ds-20">
      <header>
        <h1 className="text-heading-2 font-[650] text-text-primary">Calendar</h1>
        <p className="mt-ds-4 text-body-sm text-text-secondary">Browse your activity history by day, week, or month.</p>
      </header>
      {isReady ? (
        <CalendarView
          activities={activities}
          isAuthenticated={isAuthenticated}
          weekStartsOn={weekStartsOn}
          onChanged={refresh}
        />
      ) : <div className="min-h-panel-lg animate-pulse rounded-lg bg-surface-subtle" />}
    </div>
  );
}
