"use client";

import { useState } from "react";

export default function PasswordResetRequest() {
  const [message, setMessage] = useState("Password reset email will be enabled soon.");
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: Re-enable password reset email after Resend/Nodemailer setup.
    setMessage("Password reset email will be enabled soon.");
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
        Check reset availability
      </button>
    </form>
  );
}
