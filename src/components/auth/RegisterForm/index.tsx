"use client";

import { useState } from "react";

import { registerWithPassword } from "@/actions/auth";
import PasswordSetupFields from "@/components/auth/PasswordSetupFields";

export default function RegisterForm() {
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await registerWithPassword({
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });
    if (!result.success) {
      setStatus(result.error);
      setIsLoading(false);
      return;
    }
    setStatus("Verification email sent. Check your inbox to finish creating your account.");
    window.location.assign(`/verify-email?email=${encodeURIComponent(result.data.email)}`);
    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-ds-16">
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
    </form>
  );
}
