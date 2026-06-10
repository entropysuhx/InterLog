"use client";

import { ChevronDown, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useState } from "react";

import { dismissInsight, recordInsightFeedback } from "@/actions/insight";
import { cn } from "@/lib/utils";

type InsightCardProps = {
  observation: string;
  interpretation: string;
  recommendation?: string;
  evidence: string;
  confidence: "emerging" | "consistent" | "strong";
  insightId?: string;
  onChanged?: () => void;
};

const confidenceStyles = {
  emerging: "bg-activity-learning-bg text-activity-learning-icon",
  consistent: "bg-activity-deep-work-bg text-activity-deep-work-icon",
  strong: "bg-interactive-primary text-text-inverse",
} as const;

export default function InsightCard({
  observation,
  interpretation,
  recommendation,
  evidence,
  confidence,
  insightId,
  onChanged,
}: InsightCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  if (isDismissed) return null;

  return (
    <article className="rounded-xl border border-border bg-surface p-ds-20">
      <div className="flex items-start justify-between gap-ds-12">
        <span className={cn("rounded-full px-ds-8 py-ds-4 text-caption font-[550]", confidenceStyles[confidence])}>
          {confidence === "emerging" ? "Emerging pattern" : confidence === "consistent" ? "Consistent pattern" : "Strong pattern"}
        </span>
        <button
          type="button"
          aria-label="Dismiss insight"
          className="flex size-touch-target items-center justify-center rounded-md text-text-muted hover:bg-surface-hover"
          onClick={() => {
            setIsDismissed(true);
            if (insightId) void dismissInsight({ insightId }).then(onChanged);
          }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-ds-16">
        <h3 className="text-heading-4 font-semibold text-text-primary">{observation}</h3>
        <p className="mt-ds-8 text-body-sm text-text-secondary">{interpretation}</p>
      </div>
      {recommendation && (
        <div className="mt-ds-16 rounded-lg border-l-2 border-border-active bg-surface-subtle p-ds-12">
          <p className="text-label font-[550] text-text-primary">You might try:</p>
          <p className="mt-ds-4 text-body-sm text-text-secondary">{recommendation}</p>
        </div>
      )}
      <button
        type="button"
        className="mt-ds-16 flex min-h-touch-target items-center gap-ds-8 text-label text-text-secondary"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
      >
        Why am I seeing this?
        <ChevronDown size={16} className={isOpen ? "rotate-180" : ""} aria-hidden="true" />
      </button>
      {isOpen && (
        <p className="rounded-md bg-surface-subtle p-ds-12 text-caption text-text-muted">{evidence}</p>
      )}
      <div className="mt-ds-16 flex items-center justify-between border-t border-border pt-ds-12">
        <span className="flex items-center gap-ds-4 text-caption text-text-muted">
          <Sparkles size={13} aria-hidden="true" />
          AI-generated insight
        </span>
        {feedback === null ? (
          <div className="flex gap-ds-4">
            <button
              type="button"
              aria-label="Helpful"
              className="flex size-touch-target items-center justify-center rounded-md text-text-muted hover:bg-surface-hover"
              onClick={() => {
                setFeedback(true);
                if (insightId) void recordInsightFeedback({ insightId, helpful: true });
              }}
            >
              <ThumbsUp size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Not helpful"
              className="flex size-touch-target items-center justify-center rounded-md text-text-muted hover:bg-surface-hover"
              onClick={() => {
                setFeedback(false);
                if (insightId) void recordInsightFeedback({ insightId, helpful: false });
              }}
            >
              <ThumbsDown size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <span className="text-caption text-text-muted">Thanks for the feedback.</span>
        )}
      </div>
    </article>
  );
}
