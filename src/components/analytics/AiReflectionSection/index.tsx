"use client";

import { useEffect, useState } from "react";
import { Clock, Sparkles } from "lucide-react";
import { format } from "date-fns";

import { generateAiReflection, type AiReflectionResponse } from "@/actions/ai-reflection";
import { useProductData } from "@/components/providers/ProductDataProvider";

type SavedAiReflection = AiReflectionResponse & {
  generatedAt: string;
  activitiesCount: number;
  reflectionsCount: number;
  dateRange: string;
};

export default function AiReflectionSection() {
  const { activities, reflections, isReady } = useProductData();
  const [savedData, setSavedData] = useState<SavedAiReflection | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isReady) return;
    const stored = window.localStorage.getItem("interlog:ai-reflection");
    if (stored) {
      try {
        setSavedData(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, [isReady]);

  if (!isReady) return null;

  const hasEnoughData = activities.length >= 3;

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");

    // Gather recent activities (last 50) and reflections (last 10)
    const recentActivities = activities.slice(0, 50).map(a => `${a.title} (${Math.round((a.duration ?? 0) / 60)}m, ${a.categoryKey})`);
    const recentReflections = reflections.slice(0, 10).map(r => `${r.activityDate}: Q: ${r.prompt} A: ${r.answer}`);
    
    let dateRange = "recently";
    if (activities.length > 0) {
      const dates = activities.slice(0, 50).map(a => new Date(a.startTime).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      dateRange = `${format(minDate, "MMM d")} - ${format(maxDate, "MMM d")}`;
    }

    const result = await generateAiReflection({
      activitiesText: recentActivities.join("\n"),
      reflectionsText: recentReflections.join("\n"),
    });

    if (result.success) {
      const newData: SavedAiReflection = {
        ...result.data,
        generatedAt: new Date().toISOString(),
        activitiesCount: recentActivities.length,
        reflectionsCount: recentReflections.length,
        dateRange,
      };
      setSavedData(newData);
      window.localStorage.setItem("interlog:ai-reflection", JSON.stringify(newData));
    } else {
      setError(result.error);
    }
    
    setIsGenerating(false);
  }

  return (
    <section className="space-y-ds-16" aria-labelledby="ai-reflection-heading">
      <header>
        <h2 id="ai-reflection-heading" className="text-heading-3 font-semibold text-text-primary">
          ✨ Reflection Studio
        </h2>
        <p className="mt-ds-4 text-body-sm text-text-secondary">Create a gentle AI reflection from your time logs.</p>
      </header>

      {!hasEnoughData ? (
        <div className="rounded-xl border border-border bg-surface p-ds-20 text-center">
          <p className="text-body-sm text-text-secondary">Track a few activities and reflections to generate your personalized insights.</p>
        </div>
      ) : isGenerating ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-ds-32 text-center min-h-[300px]">
          <div className="relative mb-ds-16">
            <Clock size={40} className="text-interactive-primary animate-[spin_8s_linear_infinite]" aria-hidden="true" />
            <Sparkles size={20} className="absolute -top-ds-8 -right-ds-8 text-interactive-primary animate-pulse" aria-hidden="true" />
            <Sparkles size={14} className="absolute -bottom-ds-4 -left-ds-4 text-interactive-primary/60 animate-pulse delay-75" aria-hidden="true" />
          </div>
          <p className="text-label font-[550] text-text-primary">Turning your time into reflection...</p>
          <div className="mt-ds-12 flex items-center justify-center gap-ds-8">
            <span className="h-ds-8 w-ds-8 rounded-full bg-interactive-primary animate-bounce delay-75" />
            <span className="h-ds-8 w-ds-8 rounded-full bg-interactive-primary animate-bounce delay-150" />
            <span className="h-ds-8 w-ds-8 rounded-full bg-interactive-primary animate-bounce delay-300" />
          </div>
        </div>
      ) : savedData ? (
        <div className="space-y-ds-16">
          <article className="rounded-xl border border-border bg-surface p-ds-24 shadow-sm">
            <h3 className="flex items-center gap-ds-8 text-heading-4 font-semibold text-text-primary">
              <Sparkles size={18} className="text-interactive-primary" aria-hidden="true" />
              AI Reflection
            </h3>
            <p className="mt-ds-12 text-body-lg text-text-primary">{savedData.reflection}</p>
          </article>
          
          <article className="rounded-xl border border-border bg-surface p-ds-24 shadow-sm">
            <h3 className="text-heading-4 font-semibold text-text-primary">
              👀 One Thing Worth Noticing
            </h3>
            <p className="mt-ds-12 text-body-lg text-text-primary">{savedData.observation}</p>
          </article>
          
          <article className="rounded-xl border border-border bg-surface p-ds-24 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-ds-12 mb-ds-16">
              <h3 className="text-heading-4 font-semibold text-text-primary">
                💌 Letter From Your Week
              </h3>
              {savedData.theme && (
                <span className="inline-flex items-center rounded-full bg-interactive-primary/10 border border-interactive-primary/20 px-ds-12 py-ds-4 text-caption font-[550] text-interactive-primary">
                  Theme of the Week: {savedData.theme}
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-body-lg text-text-primary">{savedData.weeklyLetter}</p>
          </article>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-ds-12 rounded-lg border border-border bg-surface p-ds-16">
            <div>
              <p className="text-caption text-text-muted">
                Based on your recent time logs and reflections. {savedData.activitiesCount} activities, {savedData.reflectionsCount} reflections analyzed. {savedData.dateRange}.
              </p>
              <p className="text-caption text-text-muted mt-ds-2">
                Generated on {format(new Date(savedData.generatedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              className="min-h-touch-target whitespace-nowrap rounded-md border border-border px-ds-16 text-label font-[550] text-text-primary hover:bg-surface-hover"
            >
              Regenerate
            </button>
          </div>
          {error && <p className="text-body-sm text-status-error">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-ds-32 text-center">
          <Sparkles size={32} className="text-interactive-primary mb-ds-12" aria-hidden="true" />
          <button
            type="button"
            onClick={() => void handleGenerate()}
            className="min-h-touch-target rounded-md bg-interactive-primary px-ds-20 text-label font-[550] text-text-inverse hover:bg-interactive-primary-hover"
          >
            Create AI Reflection
          </button>
          {error && <p className="mt-ds-8 text-body-sm text-status-error">{error}</p>}
        </div>
      )}
    </section>
  );
}
