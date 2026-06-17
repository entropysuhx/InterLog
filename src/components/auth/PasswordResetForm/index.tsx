"use client";

import { useState } from "react";

import { resetPassword } from "@/actions/auth";
import PasswordSetupFields from "@/components/auth/PasswordSetupFields";

export default function PasswordResetForm({ email, token }: { email: string; token: string }) {
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      return;
    }
    setConfirmError("");
    setIsLoading(true);
    const result = await resetPassword({ email, token, password });
    setMessage(result.success ? "Password updated. You can now sign in." : result.error);
    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-ds-16">
      <PasswordSetupFields
        password={password}
        onPasswordChange={(value) => {
          setPassword(value);
          if (confirmError && value === confirmPassword) setConfirmError("");
        }}
        passwordId="reset-password"
        passwordName="password"
        passwordLabel="New Password"
        autoComplete="new-password"
        confirmPassword={confirmPassword}
        onConfirmPasswordChange={(value) => {
          setConfirmPassword(value);
          if (confirmError && password === value) setConfirmError("");
        }}
        confirmPasswordId="confirm-reset-password"
        confirmPasswordName="confirmPassword"
        confirmPasswordLabel="Confirm New Password"
        confirmError={confirmError}
      />
      {message && <p role="status" className="text-body-sm text-text-secondary">{message}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="min-h-touch-target w-full rounded-md bg-interactive-primary px-ds-16 text-label text-text-inverse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Updating password..." : "Update password"}
      </button>
    </form>
  );
}
