"use client";

import { Circle, CircleCheck, Eye, EyeOff, Wand2 } from "lucide-react";
import { useState } from "react";

type PasswordSetupFieldsProps = {
  password: string;
  onPasswordChange: (value: string) => void;
  passwordId: string;
  passwordName: string;
  passwordLabel: string;
  autoComplete: string;
  confirmPassword?: string;
  onConfirmPasswordChange?: (value: string) => void;
  confirmPasswordId?: string;
  confirmPasswordName?: string;
  confirmPasswordLabel?: string;
  confirmError?: string;
};

export default function PasswordSetupFields({
  password,
  onPasswordChange,
  passwordId,
  passwordName,
  passwordLabel,
  autoComplete,
  confirmPassword,
  onConfirmPasswordChange,
  confirmPasswordId,
  confirmPasswordName,
  confirmPasswordLabel = "Confirm New Password",
  confirmError,
}: PasswordSetupFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const hasConfirmField =
    confirmPassword !== undefined &&
    onConfirmPasswordChange &&
    confirmPasswordId &&
    confirmPasswordName;

  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
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

  function generatePassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    const generated = `${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}A1a`;
    onPasswordChange(generated);
    onConfirmPasswordChange?.(generated);
    setCopyStatus("");
  }

  async function copyPassword() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopyStatus("Copied");
  }

  return (
    <div className="space-y-ds-12">
      <div className="space-y-ds-8">
        <label className="block text-label text-text-secondary" htmlFor={passwordId}>
          {passwordLabel}
        </label>
        <div className="flex min-h-touch-target items-center rounded-md border border-border bg-background px-ds-12 focus-within:border-border-active">
          <input
            id={passwordId}
            name={passwordName}
            type={showPassword ? "text" : "password"}
            autoComplete={autoComplete}
            minLength={8}
            required
            value={password}
            onChange={(event) => {
              onPasswordChange(event.target.value);
              setCopyStatus("");
            }}
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

      {hasConfirmField ? (
        <div className="space-y-ds-8">
          <label className="block text-label text-text-secondary" htmlFor={confirmPasswordId}>
            {confirmPasswordLabel}
          </label>
          <div className="flex min-h-touch-target items-center rounded-md border border-border bg-background px-ds-12 focus-within:border-border-active">
            <input
              id={confirmPasswordId}
              name={confirmPasswordName}
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => onConfirmPasswordChange(event.target.value)}
              aria-invalid={confirmError ? "true" : undefined}
              className="min-w-0 flex-1 bg-transparent text-body-sm text-text-primary outline-none"
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="flex size-touch-target items-center justify-center rounded-md text-text-muted hover:bg-surface-hover"
            >
              {showConfirmPassword ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
            </button>
          </div>
          {confirmError ? (
            <p role="alert" className="text-body-sm text-status-error">
              {confirmError}
            </p>
          ) : null}
        </div>
      ) : null}

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
        <div className="mt-ds-12 flex flex-wrap gap-ds-8">
          <button
            type="button"
            onClick={generatePassword}
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border px-ds-12 text-label text-text-primary hover:bg-surface-hover"
          >
            <Wand2 size={16} aria-hidden="true" />
            Generate Password
          </button>
          <button
            type="button"
            onClick={copyPassword}
            disabled={!password}
            className="min-h-touch-target rounded-md border border-border px-ds-12 text-label text-text-primary hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-text-disabled"
          >
            Copy Password
          </button>
        </div>
        {copyStatus && (
          <p role="status" className="mt-ds-8 text-caption text-status-success">
            {copyStatus}
          </p>
        )}
      </div>
    </div>
  );
}
