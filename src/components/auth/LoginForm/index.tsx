"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { checkLoginRateLimit } from "@/actions/auth";
import ActionLoadingOverlay from "@/components/layout/ActionLoadingOverlay";
import ActionToast from "@/components/layout/ActionToast";
import { guestStore } from "@/lib/guest/store";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState<"credentials" | "google" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingAction("credentials");
    setError("");
    try {
      const limit = await checkLoginRateLimit({ email });
      if (!limit.success) {
        setError(limit.error);
        return;
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        const updatedLimit = await checkLoginRateLimit({ email });
        setError(updatedLimit.success ? "Check your email and password." : updatedLimit.error);
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();
      const shouldOfferMigration =
        guestStore.hasMigrationData() && !guestStore.hasSkippedMigration(normalizedEmail);
      window.location.assign(shouldOfferMigration ? "/migrate" : "/dashboard");
    } catch (error) {
      console.error("Credential sign-in failed", error);
      setError("We couldn't sign you in right now. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleGoogleSignIn() {
    setLoadingAction("google");
    setError("");
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Google sign-in failed", error);
      setError("We couldn't start Google sign-in right now. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  }

  const isLoading = loadingAction !== null;

  return (
    <form onSubmit={handleSubmit} aria-busy={isLoading} className="space-y-ds-16">
      <fieldset disabled={isLoading} className="space-y-ds-16">
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
        <div className="space-y-ds-8">
          <div className="flex items-center justify-between gap-ds-12">
            <label className="text-label text-text-secondary" htmlFor="login-password">
              Password
            </label>
            <Link href="/forgot-password" className="text-label text-interactive-primary">
              Forgot Password?
            </Link>
          </div>
          <div className="flex min-h-touch-target items-center rounded-md border border-border bg-background px-ds-12 focus-within:border-border-active">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-body-sm text-text-primary outline-none"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              className="flex size-touch-target items-center justify-center rounded-md text-text-muted hover:bg-surface-hover"
            >
              {showPassword ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </fieldset>
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
        disabled={isLoading}
        onClick={() => void handleGoogleSignIn()}
        className="flex min-h-touch-target w-full items-center justify-center gap-ds-12 rounded-md border border-border bg-surface-elevated px-ds-16 text-label font-[550] text-text-primary shadow-sm hover:bg-surface-hover hover:border-border-hover"
      >
        <Image src="/google-logo.svg" alt="" width={20} height={20} aria-hidden="true" />
        Continue with Google
      </button>
      {loadingAction && (
        <ActionLoadingOverlay
          title={loadingAction === "google" ? "Connecting to Google..." : "Signing you in..."}
          subtitle="This may take a few seconds."
        />
      )}
      {error && <ActionToast message={error} tone="error" onDismiss={() => setError("")} />}
    </form>
  );
}
