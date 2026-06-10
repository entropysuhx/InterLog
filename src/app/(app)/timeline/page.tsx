"use client";

import TimelineView from "@/components/timeline/TimelineView";
import { useProductData } from "@/components/providers/ProductDataProvider";

export default function TimelinePage() {
  const { activities, isAuthenticated, isReady, refresh } = useProductData();
  return (
    <div className="space-y-ds-20">
      <header>
        <h1 className="text-heading-2 font-[650] text-text-primary">Timeline</h1>
        <p className="mt-ds-4 text-body-sm text-text-secondary">A chronological view of what actually happened.</p>
      </header>
      {isReady ? (
        <TimelineView
          activities={activities}
          isAuthenticated={isAuthenticated}
          onChanged={refresh}
        />
      ) : <div className="min-h-panel-lg animate-pulse rounded-lg bg-surface-subtle" />}
    </div>
  );
}
