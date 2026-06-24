"use client";

import { useState } from "react";

import { resendVerificationEmail } from "@/actions/auth";
import ActionLoadingOverlay from "@/components/layout/ActionLoadingOverlay";
import ActionToast from "@/components/layout/ActionToast";

export default function ResendVerificationForm({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      const result = await resendVerificationEmail({ email });
      setMessage(
        result.success
          ? "If this account still needs verification, we sent a new link."
          : result.error,
      );
      setMessageTone(result.success ? "success" : "error");
    } catch (error) {
      console.error("Verification email request failed", error);
      setMessage("We couldn't send the email right now. Please try again.");
      setMessageTone("error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-ds-12">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="flex min-h-touch-target w-full items-center justify-center rounded-md border border-border bg-interactive-secondary px-ds-16 text-label text-text-primary hover:bg-interactive-secondary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Sending..." : "Resend verification email"}
      </button>
      {message && (
        <p role="status" className="text-body-sm text-text-secondary">
          {message}
        </p>
      )}
      {isLoading && (
        <ActionLoadingOverlay
          title="Sending verification email..."
          subtitle="Check your inbox in a moment."
        />
      )}
      {message && (
        <ActionToast message={message} tone={messageTone} onDismiss={() => setMessage("")} />
      )}
    </div>
  );
}
