"use client";

import { useState } from "react";

import { requestPasswordReset } from "@/actions/auth";

export default function PasswordResetRequest() {
  const [message, setMessage] = useState("");
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await requestPasswordReset({ email: String(formData.get("email")) });
    setMessage("If an account exists, a reset link is on its way.");
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-ds-16">
      <label className="block text-label text-text-secondary">
        Email
        <input
          name="email"
          type="email"
          required
          className="mt-ds-8 min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12"
        />
      </label>
      {message && <p role="status" className="text-body-sm text-text-secondary">{message}</p>}
      <button type="submit" className="min-h-touch-target w-full rounded-md bg-interactive-primary px-ds-16 text-label text-text-inverse">
        Send reset link
      </button>
    </form>
  );
}

