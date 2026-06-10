"use client";

import { useEffect, useRef, useState } from "react";

import { generateInsights } from "@/actions/insight";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import InsightCard from "@/components/insight/InsightCard";
import { useProductData } from "@/components/providers/ProductDataProvider";

export default function AnalyticsPage() {
  const {
    activities,
    reflectionDays,
    insights,
    isAuthenticated,
    isReady,
    refresh,
  } = useProductData();
  const requestedInsights = useRef(false);
  const [insightStatus, setInsightStatus] = useState("");

  useEffect(() => {
    if (!isAuthenticated || requestedInsights.current) return;
    requestedInsights.current = true;
    setInsightStatus("Checking for updated patterns...");
    void generateInsights({ periodDays: 14 }).then((result) => {
      if (result.success && result.data.generated > 0) refresh();
      setInsightStatus(result.success ? "" : result.error);
    });
  }, [isAuthenticated, refresh]);
  return (
    <div className="space-y-ds-24">
      <header>
        <h1 className="text-heading-2 font-[650] text-text-primary">Analytics</h1>
        <p className="mt-ds-4 text-body-sm text-text-secondary">Patterns from your own history, without comparison to anyone else.</p>
      </header>
      {isReady ? (
        <>
          <AnalyticsDashboard activities={activities} reflectionDays={reflectionDays} />
          <section className="space-y-ds-16" aria-label="Your insights">
            <div>
              <h2 className="text-heading-3 font-semibold text-text-primary">Your insights</h2>
              <p className="mt-ds-4 text-body-sm text-text-muted">
                {isAuthenticated
                  ? "Insights use activity timing and categories. Reflection text and mood stay private."
                  : "Guest insights are calculated locally from anonymized timing data."}
              </p>
            </div>
            {insightStatus && <p role="status" className="text-caption text-text-muted">{insightStatus}</p>}
            {isAuthenticated && insights.length > 0 ? (
              insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  {...insight}
                  insightId={insight.id}
                  onChanged={refresh}
                />
              ))
            ) : (
              <InsightCard
                confidence={activities.length >= 7 ? "strong" : activities.length >= 3 ? "consistent" : "emerging"}
                observation={activities.length ? "Your activity history is beginning to show a rhythm." : "Your first pattern will appear after a few entries."}
                interpretation={activities.length ? "Repeated timing and category choices can make routines easier to notice." : "There is not enough data for a meaningful interpretation yet."}
                recommendation={activities.length ? "Keep logging at the moments that feel useful, then review the weekly trend." : undefined}
                evidence={`Across ${activities.length} activities ${isAuthenticated ? "in your account" : "stored on this device"}.`}
              />
            )}
          </section>
        </>
      ) : (
        <div className="min-h-panel-lg animate-pulse rounded-lg bg-surface-subtle" />
      )}
    </div>
  );
}
