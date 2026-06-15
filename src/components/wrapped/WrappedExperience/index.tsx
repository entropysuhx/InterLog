"use client";

import { ChevronLeft, ChevronRight, Download, RotateCcw, Share, Sparkles } from "lucide-react";
import html2canvas from "html2canvas";
import { useEffect, useMemo, useRef, useState } from "react";

import { generateWrapped } from "@/actions/wrapped";
import WrappedVisual from "@/components/wrapped/WrappedVisual";
import { calculateAnalytics } from "@/lib/analytics/calculate";
import { formatDuration } from "@/lib/utils";
import type { ActivityView, WrappedCardData } from "@/types";

type WrappedExperienceProps = {
  activities: ActivityView[];
  reflectionDays: number;
  isAuthenticated?: boolean;
};

export default function WrappedExperience({
  activities,
  reflectionDays,
  isAuthenticated = false,
}: WrappedExperienceProps) {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [generatedCards, setGeneratedCards] = useState<WrappedCardData[] | null>(null);
  const [insufficientData, setInsufficientData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const localCards = useMemo<WrappedCardData[]>(() => {
    const now = new Date();
    const periodActivities = activities.filter((activity) => {
      const start = new Date(activity.startTime);
      return period === "yearly"
        ? start.getFullYear() === now.getFullYear()
        : start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth();
    });
    const snapshot = calculateAnalytics(periodActivities, period === "monthly" ? 31 : 365);
    const top = snapshot.categoryBreakdown[0];
    return [
      {
        type: "orientation",
        headline: `Your ${period === "monthly" ? "month" : "year"} in time`,
        body: "A calm look at what you made visible.",
      },
      {
        type: "time-overview",
        headline: "Time you tracked",
        body: "Every entry adds context to the story of your days.",
        stat: { value: formatDuration(snapshot.totalTrackedSeconds), label: "tracked this month" },
      },
      ...(top
        ? [{
            type: "category-story" as const,
            headline: `${top.name} stood out`,
            body: `${top.sessions} sessions made this your most recorded category.`,
            stat: { value: formatDuration(top.seconds), label: top.name },
          }]
        : []),
      {
        type: "focus-pattern",
        headline: "Focused time",
        body: "Deep work is shown as a pattern, not a score.",
        stat: { value: formatDuration(snapshot.focusSeconds), label: "deep work" },
      },
      {
        type: "reflection-highlight",
        headline: `${reflectionDays} reflection days`,
        body: "Reflection adds meaning to the activity record without being graded.",
      },
      {
        type: "forward-prompt",
        headline: "What pattern do you want to keep?",
        body: "Choose one useful thread to carry forward.",
        ctaLabel: "Start a reflection",
      },
    ];
  }, [activities, period, reflectionDays]);
  const cards = generatedCards ?? localCards;
  const [index, setIndex] = useState(0);
  const card = cards[index];

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    const now = new Date();
    const periodKey =
      period === "monthly"
        ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        : String(now.getFullYear());
    setIsLoading(true);
    setGeneratedCards(null);
    setInsufficientData(false);
    void generateWrapped({ period, periodKey }).then((result) => {
      if (!active) return;
      if (result.success) {
        setGeneratedCards(result.data.cards);
        setInsufficientData(result.data.insufficientData);
      }
      setIsLoading(false);
      setIndex(0);
    });
    return () => {
      active = false;
    };
  }, [isAuthenticated, period]);

  async function handleDownloadImage() {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `interlog-wrapped-${period}.png`;
      a.click();
    } catch (e) {
      console.error(e);
    }
    setIsExporting(false);
  }

  async function handleShare() {
    const text = `Here's how I spent my ${period === "monthly" ? "month" : "year"}.\n\n${card.headline}\n${card.stat ? `${card.stat.value} ${card.stat.label}\n` : ""}${card.body}`;
    if (navigator.share) {
      navigator.share({ title: "InterLog Wrapped", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert("Summary copied to clipboard!");
    }
  }

  if (insufficientData) {
    return (
      <section className="mx-auto max-w-reading rounded-2xl border border-border bg-surface p-ds-32 text-center">
        <h2 className="text-heading-3 font-semibold text-text-primary">A little more history is needed</h2>
        <p className="mt-ds-12 text-body-sm text-text-secondary">
          Yearly Wrapped becomes available after ten hours of tracked activity.
        </p>
        <button
          type="button"
          className="mt-ds-20 min-h-touch-target rounded-md border border-border px-ds-16 text-label text-text-primary"
          onClick={() => setPeriod("monthly")}
        >
          View monthly Wrapped
        </button>
      </section>
    );
  }

  return (
    <section id="wrapped-overlay" className="mx-auto max-w-reading" aria-label="InterLog Wrapped">
      <div className="mb-ds-16 flex justify-center gap-ds-8">
        {(["monthly", "yearly"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setPeriod(option);
              setGeneratedCards(null);
              setIndex(0);
            }}
            className={
              period === option
                ? "min-h-touch-target rounded-full bg-interactive-primary px-ds-16 text-label text-text-inverse"
                : "min-h-touch-target rounded-full border border-border bg-surface px-ds-16 text-label text-text-secondary"
            }
          >
            {option === "monthly" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>
      <article ref={cardRef} className="min-h-panel-lg rounded-2xl bg-surface-elevated p-ds-32 shadow-xl md:p-ds-48 overflow-hidden relative">
        <span className="flex items-center gap-ds-8 text-label font-[550] text-interactive-primary">
          <Sparkles size={18} aria-hidden="true" className="animate-pulse" />
          InterLog Wrapped
        </span>
        {isLoading && <p className="mt-ds-12 text-caption text-text-muted">Preparing your report...</p>}
        <div key={index} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
          <div className="mt-ds-24">
            <WrappedVisual type={card.type} />
          </div>
          <div className="mt-ds-32">
            <p className="text-caption uppercase text-text-muted">{card.type.replaceAll("-", " ")}</p>
            <h2 className="mt-ds-12 text-heading-2 font-[650] text-text-primary">{card.headline}</h2>
            {card.stat && (
              <div className="mt-ds-24">
                <p className="text-display-m font-[650] tabular-nums text-interactive-primary animate-in zoom-in-95 duration-700 delay-150 fill-mode-both">{card.stat.value}</p>
                <p className="text-body-md text-text-secondary">{card.stat.label}</p>
              </div>
            )}
            <p className="mt-ds-24 text-body-lg text-text-secondary">{card.body}</p>
          </div>
        </div>
      </article>
      <div className="mt-ds-16 flex flex-wrap items-center justify-between gap-ds-12">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border px-ds-12 text-label disabled:text-text-disabled"
        >
          <ChevronLeft size={16} aria-hidden="true" /> Previous
        </button>
        <div className="flex gap-ds-8" aria-label={`Card ${index + 1} of ${cards.length}`}>
          {cards.map((item, cardIndex) => (
            <button
              key={`${item.type}-${cardIndex}`}
              type="button"
              aria-label={`Go to card ${cardIndex + 1}`}
              onClick={() => setIndex(cardIndex)}
              className={cardIndex === index ? "size-ds-8 rounded-full bg-interactive-primary" : "size-ds-8 rounded-full bg-surface-active"}
            />
          ))}
        </div>
        {index === cards.length - 1 ? (
          <button
            type="button"
            onClick={() => setIndex(0)}
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md bg-interactive-primary px-ds-12 text-label text-text-inverse"
          >
            <RotateCcw size={16} aria-hidden="true" /> Replay
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((value) => Math.min(cards.length - 1, value + 1))}
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md bg-interactive-primary px-ds-12 text-label text-text-inverse"
          >
            Next <ChevronRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="mt-ds-32 border-t border-border pt-ds-20">
        <h3 className="text-label font-[550] text-text-primary">Share Your {period === "monthly" ? "Month" : "Year"}</h3>
        <p className="mt-ds-4 text-caption text-text-muted">A look back at the moments that shaped my time.</p>
        <div className="mt-ds-16 flex flex-wrap gap-ds-12">
          <button
            type="button"
            onClick={() => void handleDownloadImage()}
            disabled={isExporting}
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md bg-interactive-primary px-ds-16 text-label text-text-inverse disabled:opacity-50"
          >
            <Download size={16} aria-hidden="true" />
            {isExporting ? "Capturing..." : "Download Image"}
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border px-ds-16 text-label text-text-primary hover:bg-surface-hover"
          >
            <Share size={16} aria-hidden="true" />
            Share Summary
          </button>
        </div>
      </div>
    </section>
  );
}
