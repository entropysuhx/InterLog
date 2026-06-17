"use client";

import { Circle, CircleCheck, Eye, EyeOff, Wand2 } from "lucide-react";
import { useState } from "react";
import { signIn } from "next-auth/react";

import { registerWithPassword } from "@/actions/auth";
import { guestStore } from "@/lib/guest/store";

export default function RegisterForm() {
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const requirements = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
  ];
  const metCount = requirements.filter((requirement) => requirement.met).length;
  const strength = metCount <= 1 ? "Weak" : metCount <= 3 ? "Medium" : "Strong";
  const strengthClass =
    strength === "Strong"
      ? "bg-status-success"
      : strength === "Medium"
        ? "bg-status-warning"
        : "bg-status-error";

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
    setStatus("Account created. Signing you in...");
    const signInResult = await signIn("credentials", {
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      redirect: false,
    });
    if (signInResult?.error) {
      window.location.assign("/login");
      return;
    }
    const normalizedEmail = String(formData.get("email")).trim().toLowerCase();
    const shouldOfferMigration =
      guestStore.hasMigrationData() && !guestStore.hasSkippedMigration(normalizedEmail);
    window.location.assign(shouldOfferMigration ? "/migrate" : "/dashboard");
    setIsLoading(false);
  }

  function generatePassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    const generated = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
    setPassword(`${generated}A1a`);
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
      <div className="space-y-ds-8">
        <label className="block text-label text-text-secondary" htmlFor="register-password">
          Password
        </label>
        <div className="flex min-h-touch-target items-center rounded-md border border-border bg-background px-ds-12 focus-within:border-border-active">
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
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
        <div className="rounded-md bg-surface-subtle p-ds-12">
          <div className="flex items-center justify-between gap-ds-12">
            <p className="text-label font-[550] text-text-primary">Password strength</p>
            <span className="text-caption font-[550] text-text-secondary">{strength}</span>
          </div>
          <div className="mt-ds-8 grid grid-cols-4 gap-ds-4" aria-hidden="true">
            {requirements.map((requirement, index) => (
              <span
                key={requirement.label}
                className={
                  index < metCount
                    ? `h-ds-4 rounded-full ${strengthClass}`
                    : "h-ds-4 rounded-full bg-surface"
                }
              />
            ))}
          </div>
          <ul className="mt-ds-12 grid gap-ds-4 text-caption text-text-secondary">
            {requirements.map((requirement) => (
              <li key={requirement.label} className="flex items-center gap-ds-8">
                {requirement.met ? (
                  <CircleCheck
                    size={16}
                    aria-hidden="true"
                    className="fill-status-success text-text-inverse"
                  />
                ) : (
                  <Circle size={16} aria-hidden="true" className="text-text-muted" />
                )}
                {requirement.label}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={generatePassword}
            className="mt-ds-12 flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border px-ds-12 text-label text-text-primary hover:bg-surface-hover"
          >
            <Wand2 size={16} aria-hidden="true" />
            Generate secure password
          </button>
        </div>
      </div>
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
