"use client";

import { Cloud, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { guestStore } from "@/lib/guest/store";

export default function RegistrationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => setIsVisible(guestStore.shouldPromptRegistration()), []);
  if (!isVisible) return null;

  return (
    <aside className="flex flex-col gap-ds-12 rounded-lg border border-border-active bg-surface-active p-ds-16 sm:flex-row sm:items-center">
      <Cloud size={20} className="text-interactive-primary" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-label font-[550] text-text-primary">Keep your history safe</p>
        <p className="mt-ds-4 text-body-sm text-text-secondary">
          Create an account for backup, sync, and access on other devices.
        </p>
      </div>
      <Link
        href="/register"
        className="flex min-h-touch-target items-center justify-center rounded-md bg-interactive-primary px-ds-16 text-label text-text-inverse"
      >
        Create account
      </Link>
      <button
        type="button"
        aria-label="Maybe later"
        className="flex size-touch-target items-center justify-center rounded-md text-text-muted hover:bg-surface-hover"
        onClick={() => {
          guestStore.dismissRegistrationPrompt();
          setIsVisible(false);
        }}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}

