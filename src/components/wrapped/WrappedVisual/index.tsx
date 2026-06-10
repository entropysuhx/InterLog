import type { WrappedCardData } from "@/types";

const visualTone: Record<WrappedCardData["type"], string> = {
  orientation: "text-interactive-primary",
  "time-overview": "text-activity-deep-work-icon",
  "category-story": "text-activity-learning-icon",
  "focus-pattern": "text-activity-reflection-icon",
  "reflection-highlight": "text-activity-personal-icon",
  achievement: "text-status-warning",
  "forward-prompt": "text-status-info",
};

export default function WrappedVisual({ type }: { type: WrappedCardData["type"] }) {
  return (
    <div
      className={`flex min-h-panel-sm items-center justify-center rounded-xl bg-surface-subtle ${visualTone[type]}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 240 160"
        className="h-panel-sm w-full max-w-panel-md"
        fill="none"
      >
        <circle cx="120" cy="80" r="52" fill="currentColor" opacity="0.1" />
        <circle cx="120" cy="80" r="34" stroke="currentColor" strokeWidth="6" opacity="0.35" />
        {type === "time-overview" || type === "focus-pattern" ? (
          <>
            <path d="M120 48V80L143 94" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            <circle cx="120" cy="80" r="6" fill="currentColor" />
          </>
        ) : type === "category-story" ? (
          <>
            <rect x="74" y="94" width="22" height="28" rx="6" fill="currentColor" opacity="0.35" />
            <rect x="109" y="69" width="22" height="53" rx="6" fill="currentColor" opacity="0.65" />
            <rect x="144" y="45" width="22" height="77" rx="6" fill="currentColor" />
          </>
        ) : type === "reflection-highlight" ? (
          <>
            <path d="M78 50H151C159 50 166 57 166 65V109H94C85 109 78 102 78 93V50Z" stroke="currentColor" strokeWidth="7" />
            <path d="M96 70H146M96 87H136" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
          </>
        ) : type === "achievement" ? (
          <>
            <path d="M120 42L132 66L159 70L139 89L144 116L120 103L96 116L101 89L81 70L108 66L120 42Z" fill="currentColor" />
          </>
        ) : type === "forward-prompt" ? (
          <>
            <path d="M72 102C95 72 118 64 165 61" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            <path d="M145 43L166 61L146 80" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : (
          <>
            <path d="M79 92C94 64 111 52 129 52C148 52 162 68 162 88C162 108 145 120 120 120C96 120 78 109 78 92Z" fill="currentColor" opacity="0.55" />
            <circle cx="101" cy="82" r="7" fill="currentColor" />
            <circle cx="139" cy="82" r="7" fill="currentColor" />
          </>
        )}
        <circle cx="49" cy="45" r="8" fill="currentColor" opacity="0.45" />
        <circle cx="193" cy="112" r="11" fill="currentColor" opacity="0.25" />
      </svg>
    </div>
  );
}
