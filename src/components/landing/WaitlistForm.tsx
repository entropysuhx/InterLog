"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function WaitlistForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("submitting");
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setStatus("success");
    setEmail("");
    setName("");
  }

  if (status === "success") {
    return (
      <div className="flex animate-in fade-in zoom-in-95 items-center gap-ds-12 rounded-lg border border-border bg-surface-subtle p-ds-20 text-text-primary duration-500">
        <CheckCircle2 size={24} className="text-interactive-primary" />
        <div>
          <p className="text-label font-[550]">Thank you.</p>
          <p className="text-body-sm text-text-secondary">You're on the list.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-ds-12 sm:max-w-md">
      <div className="flex flex-col gap-ds-4 sm:flex-row">
        <input
          type="text"
          placeholder="First name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="min-h-touch-target flex-1 rounded-md border border-border bg-surface px-ds-12 text-body-md text-text-primary placeholder:text-text-muted focus:border-border-active focus:outline-focus-ring"
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="min-h-touch-target flex-[2] rounded-md border border-border bg-surface px-ds-12 text-body-md text-text-primary placeholder:text-text-muted focus:border-border-active focus:outline-focus-ring"
        />
      </div>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex min-h-touch-target w-full items-center justify-center gap-ds-8 rounded-md bg-interactive-primary px-ds-16 text-label text-text-inverse transition-colors hover:bg-interactive-primary-hover disabled:opacity-50 sm:w-auto"
      >
        {status === "submitting" ? "Joining..." : "Join Waitlist"}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
