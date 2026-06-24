"use client";

import { useState } from "react";

import { registerWithPassword } from "@/actions/auth";
import PasswordSetupFields from "@/components/auth/PasswordSetupFields";
import ActionLoadingOverlay from "@/components/layout/ActionLoadingOverlay";
import ActionToast from "@/components/layout/ActionToast";

export default function RegisterForm() {
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setStatus("");
    try {
      const formData = new FormData(event.currentTarget);
      const result = await registerWithPassword({
        name: String(formData.get("name")),
        email: String(formData.get("email")),
        password: String(formData.get("password")),
      });
      if (!result.success) {
        setStatus(result.error);
        setStatusTone("error");
        return;
      }
      setStatus(
        result.data.resumedVerification
          ? "An account with this email is waiting for verification. We sent you a new verification email."
          : "Verification email sent. Check your inbox to finish creating your account.",
      );
      setStatusTone("success");
      const verificationUrl = new URL("/verify-email", window.location.origin);
      verificationUrl.searchParams.set("email", result.data.email);
      if (result.data.resumedVerification) verificationUrl.searchParams.set("resumed", "1");
      window.location.assign(verificationUrl.toString());
    } catch (error) {
      console.error("Registration request failed", error);
      setStatus("We couldn't create your account right now. Please try again.");
      setStatusTone("error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={isLoading} className="space-y-ds-16">
      <fieldset disabled={isLoading} className="space-y-ds-16">
        <label className="block text-label text-text-secondary">
          Name
          <input
            name="name"
            type="text"
            autoComplete="name"
            required
            className="mt-ds-8 min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12 text-body-sm text-text-primary"
          />
        </label>
        <label className="block text-label text-text-secondary">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-ds-8 min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12 text-body-sm text-text-primary"
          />
        </label>
        <PasswordSetupFields
          password={password}
          onPasswordChange={setPassword}
          passwordId="register-password"
          passwordName="password"
          passwordLabel="Password"
          autoComplete="new-password"
        />
      </fieldset>
      {status && (
        <p role="status" className="text-body-sm text-text-secondary">
          {status}
        </p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="min-h-touch-target w-full rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse"
      >
        {isLoading ? "Creating account..." : "Create account"}
      </button>
      {isLoading && (
        <ActionLoadingOverlay
          title="Creating your account..."
          subtitle="We're setting everything up for you."
        />
      )}
      {status && <ActionToast message={status} tone={statusTone} onDismiss={() => setStatus("")} />}
    </form>
  );
}
