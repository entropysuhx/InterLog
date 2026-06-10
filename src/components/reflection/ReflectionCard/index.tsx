"use client";

import { BookOpen, Check, ChevronDown, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { saveReflection } from "@/actions/reflection";
import { guestStore } from "@/lib/guest/store";
import { selectReflectionPrompts } from "@/lib/reflection/prompts";
import type { ActivityView, ReflectionView } from "@/types";

type ReflectionCardProps = {
  activities: ActivityView[];
  date: string;
  isAuthenticated?: boolean;
  savedReflections?: ReflectionView[];
  onSaved?: () => void;
  compact?: boolean;
};

const moods = [
  { value: 1, label: "Difficult" },
  { value: 2, label: "Low" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Great" },
] as const;

export default function ReflectionCard({
  activities,
  date,
  isAuthenticated = false,
  savedReflections = [],
  onSaved,
  compact = false,
}: ReflectionCardProps) {
  const prompts = useMemo(() => selectReflectionPrompts(activities), [activities]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mood, setMood] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [status, setStatus] = useState("");
  const [isEditing, setIsEditing] = useState(savedReflections.length === 0);
  const [savedAt, setSavedAt] = useState<string | null>(
    savedReflections[0]?.updatedAt ?? null,
  );

  useEffect(() => {
    const persisted = savedReflections.filter((reflection) => reflection.activityDate === date);
    if (persisted.length > 0) {
      setAnswers(Object.fromEntries(persisted.map((reflection) => [reflection.prompt, reflection.answer])));
      setSavedAt(persisted[0].updatedAt);
      setIsEditing(false);
      return;
    }
    const draft = guestStore.getReflectionDraft<{ answers: Record<string, string>; mood: number | null }>(date);
    if (draft) {
      setAnswers(draft.answers);
      setMood(draft.mood);
    }
  }, [date, savedReflections]);

  useEffect(() => {
    if (!isEditing) return;
    const timeout = window.setTimeout(() => {
      guestStore.saveReflectionDraft(date, { answers, mood, savedAt: new Date().toISOString() });
      if (Object.values(answers).some(Boolean)) setStatus("Draft saved on this device");
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [answers, date, isEditing, mood]);

  const allPrompts = [prompts.primaryPrompt, ...prompts.optionalPrompts];

  async function handleSave() {
    const completed = allPrompts
      .map((prompt) => ({ prompt, answer: answers[prompt]?.trim() ?? "" }))
      .filter((answer) => answer.answer);
    if (!completed[0]?.answer) return;
    if (isAuthenticated) {
      const result = await saveReflection({
        activityDate: date,
        answers: completed,
        mood: mood ?? undefined,
      });
      if (!result.success) {
        setStatus(result.error);
        return;
      }
    } else {
      guestStore.saveReflections(date, completed);
    }
    guestStore.clearReflectionDraft(date);
    setStatus("Reflection saved.");
    setSavedAt(new Date().toISOString());
    setIsEditing(false);
    onSaved?.();
  }

  return (
    <section id="reflection-card" className="rounded-xl border border-border bg-surface p-ds-20">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setIsExpanded((value) => !value)}
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-ds-8 text-label font-[550] text-text-primary">
          <BookOpen size={18} className="text-interactive-primary" aria-hidden="true" />
          End-of-day reflection
        </span>
        <ChevronDown
          size={18}
          className={isExpanded ? "rotate-180 transition-transform" : "transition-transform"}
          aria-hidden="true"
        />
      </button>
      {isExpanded && (
        <div className="mt-ds-16 max-w-reading">
          {!isEditing ? (
            <article className="rounded-lg bg-surface-subtle p-ds-16">
              <div className="space-y-ds-16">
                {Object.entries(answers)
                  .filter(([, answer]) => answer.trim())
                  .map(([prompt, answer]) => (
                    <div key={prompt}>
                      <h3 className="text-label font-[550] text-text-secondary">{prompt}</h3>
                      <p className="mt-ds-4 whitespace-pre-wrap text-body-sm text-text-primary">{answer}</p>
                    </div>
                  ))}
              </div>
              <div className="mt-ds-20 flex flex-wrap items-center justify-between gap-ds-12 border-t border-border pt-ds-12">
                <p className="text-caption text-text-muted">
                  {savedAt
                    ? `Last saved ${new Date(savedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
                    : "Saved"}
                </p>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border bg-surface px-ds-12 text-label text-text-secondary hover:bg-surface-hover"
                >
                  <Pencil size={16} aria-hidden="true" />
                  Edit
                </button>
              </div>
            </article>
          ) : (
            <>
          {allPrompts.map((prompt, index) => (
            <label key={prompt} className="mb-ds-16 block">
              <span className="mb-ds-8 block text-body-sm font-[550] text-text-secondary">
                {prompt} {index > 0 && <span className="text-caption text-text-muted">(optional)</span>}
              </span>
              <textarea
                value={answers[prompt] ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({ ...current, [prompt]: event.target.value }))
                }
                rows={index === 0 ? 4 : 2}
                className="w-full resize-y rounded-md border border-border bg-background p-ds-12 text-body-sm text-text-primary placeholder:text-text-muted focus:border-border-active"
                placeholder="Write what comes to mind..."
              />
            </label>
          ))}
          <fieldset>
            <legend className="text-label font-[550] text-text-secondary">
              How did today feel? <span className="text-caption text-text-muted">(private)</span>
            </legend>
            <div className="mt-ds-8 grid grid-cols-2 gap-ds-8 sm:grid-cols-5">
              {moods.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={mood === option.value}
                  onClick={() => setMood(option.value)}
                  className={
                    mood === option.value
                      ? "min-h-touch-target rounded-md border border-border-active bg-surface-active text-caption text-text-primary"
                      : "min-h-touch-target rounded-md border border-border bg-surface text-caption text-text-secondary hover:bg-surface-hover"
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="mt-ds-16 flex flex-wrap items-center justify-between gap-ds-12">
            <span className="flex items-center gap-ds-4 text-caption text-text-muted" role="status">
              {status && <Check size={14} aria-hidden="true" />}
              {status}
            </span>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!answers[prompts.primaryPrompt]?.trim()}
              className="min-h-touch-target rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse hover:bg-interactive-primary-hover disabled:bg-surface-subtle disabled:text-text-disabled"
            >
              Save reflection
            </button>
          </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
