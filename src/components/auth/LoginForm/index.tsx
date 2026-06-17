"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { guestStore } from "@/lib/guest/store";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Check your email and password.");
      setIsLoading(false);
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const shouldOfferMigration =
      guestStore.hasMigrationData() && !guestStore.hasSkippedMigration(normalizedEmail);
    window.location.assign(shouldOfferMigration ? "/migrate" : "/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-ds-16">
      <label className="block text-label text-text-secondary">
        Email
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-ds-8 min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12 text-body-sm text-text-primary"
        />
      </label>
      <label className="block text-label text-text-secondary">
        Password
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-ds-8 min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12 text-body-sm text-text-primary"
        />
      </label>
      {error && (
        <p role="alert" className="text-body-sm text-status-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="min-h-touch-target w-full rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse hover:bg-interactive-primary-hover"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
      <button
        type="button"
        onClick={() => void signIn("google", { callbackUrl: "/migrate" })}
        className="min-h-touch-target w-full rounded-md border border-border bg-interactive-secondary px-ds-16 text-label text-text-primary hover:bg-interactive-secondary-hover"
      >
        Continue with Google
      </button>
    </form>
  );
}
