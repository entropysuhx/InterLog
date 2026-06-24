"use client";

import { useState } from "react";

import { requestPasswordReset } from "@/actions/auth";
import ActionLoadingOverlay from "@/components/layout/ActionLoadingOverlay";
import ActionToast from "@/components/layout/ActionToast";

export default function PasswordResetRequest() {
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email")).trim();
      const result = await requestPasswordReset({ email });
      setMessage(
        result.success
          ? `We sent password reset instructions to ${email} if an account exists.`
          : result.error,
      );
      setMessageTone(result.success ? "success" : "error");
    } catch (error) {
      console.error("Password reset request failed", error);
      setMessage("We couldn't send the reset email right now. Please try again.");
      setMessageTone("error");
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <form onSubmit={handleSubmit} aria-busy={isLoading} className="space-y-ds-16">
      <fieldset disabled={isLoading}>
        <label className="block text-label text-text-secondary">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-ds-8 min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12"
          />
        </label>
      </fieldset>
      {message && (
        <p role="status" className="text-body-sm text-text-secondary">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="min-h-touch-target w-full rounded-md bg-interactive-primary px-ds-16 text-label text-text-inverse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Sending reset link..." : "Send reset link"}
      </button>
      {isLoading && (
        <ActionLoadingOverlay
          title="Sending reset email..."
          subtitle="Check your inbox in a moment."
        />
      )}
      {message && (
        <ActionToast message={message} tone={messageTone} onDismiss={() => setMessage("")} />
      )}
    </form>
  );
}
