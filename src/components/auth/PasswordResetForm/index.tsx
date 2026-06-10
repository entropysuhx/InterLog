"use client";

import { useState } from "react";

import { resetPassword } from "@/actions/auth";

export default function PasswordResetForm({ email, token }: { email: string; token: string }) {
  const [message, setMessage] = useState("");
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await resetPassword({ email, token, password: String(formData.get("password")) });
    setMessage(result.success ? "Password updated. You can now sign in." : result.error);
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-ds-16">
      <label className="block text-label text-text-secondary">
        New password
        <input
          name="password"
          type="password"
          minLength={8}
          required
          className="mt-ds-8 min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12"
        />
      </label>
      {message && <p role="status" className="text-body-sm text-text-secondary">{message}</p>}
      <button type="submit" className="min-h-touch-target w-full rounded-md bg-interactive-primary px-ds-16 text-label text-text-inverse">
        Update password
      </button>
    </form>
  );
}

