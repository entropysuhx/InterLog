"use client";

import { NotebookPen, Play, Plus } from "lucide-react";
import { useState } from "react";

import ActivityEditor from "@/components/activity/ActivityEditor";

type ActivityComposerProps = {
  isAuthenticated?: boolean;
  onActivityCreated: () => void;
  onStartFocus: (title: string) => void | Promise<void>;
};

export default function ActivityComposer({
  isAuthenticated = false,
  onActivityCreated,
  onStartFocus,
}: ActivityComposerProps) {
  const [focusTitle, setFocusTitle] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  return (
    <>
      <section
        className="rounded-lg border border-border bg-surface p-ds-12"
        aria-label="Activity actions"
      >
        <div className="flex flex-col gap-ds-12 xl:flex-row">
          <label className="flex min-h-touch-target flex-1 items-center gap-ds-12 rounded-md border border-border px-ds-12 focus-within:border-border-active">
            <NotebookPen className="text-interactive-primary" size={18} aria-hidden="true" />
            <span className="sr-only">Focus session title</span>
            <input
              value={focusTitle}
              onChange={(event) => setFocusTitle(event.target.value)}
              placeholder="What did you spend time on? e.g. Deep work, Learning React, Exercise, Team meeting"
              className="min-w-0 flex-1 bg-transparent text-body-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          </label>
          <div className="flex gap-ds-8">
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="flex min-h-touch-target flex-1 items-center justify-center gap-ds-8 rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse hover:bg-interactive-primary-hover xl:flex-none"
            >
              <Plus size={16} aria-hidden="true" />
              Add Activity
            </button>
            <button
              type="button"
              onClick={() => void onStartFocus(focusTitle.trim() || "Focus session")}
              className="flex min-h-touch-target flex-1 items-center justify-center gap-ds-8 rounded-md border border-border bg-interactive-secondary px-ds-16 text-label text-text-primary hover:bg-interactive-secondary-hover xl:flex-none"
            >
              <Play size={16} aria-hidden="true" />
              Start Focus
            </button>
          </div>
        </div>
        <p className="mt-ds-8 text-caption text-text-muted">
          Track what you&apos;re doing now or log something you&apos;ve already completed.
        </p>
      </section>
      <ActivityEditor
        isOpen={isEditorOpen}
        isAuthenticated={isAuthenticated}
        initialTitle={focusTitle.trim() || undefined}
        onClose={() => setIsEditorOpen(false)}
        onSaved={onActivityCreated}
      />
    </>
  );
}
