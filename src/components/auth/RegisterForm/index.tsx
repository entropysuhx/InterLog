"use client";

import { useState } from "react";

import { registerWithPassword } from "@/actions/auth";

export default function RegisterForm() {
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await registerWithPassword({
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });
    setStatus(
      result.success
        ? "Check your email to verify your account. Your guest data remains safe here."
        : result.error,
    );
    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-ds-16">
      {["name", "email", "password"].map((field) => (
        <label key={field} className="block text-label capitalize text-text-secondary">
          {field}
          <input
            name={field}
            type={field === "password" ? "password" : field === "email" ? "email" : "text"}
            autoComplete={field === "password" ? "new-password" : field}
            minLength={field === "password" ? 8 : undefined}
            required
            className="mt-ds-8 min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12 text-body-sm text-text-primary"
          />
        </label>
      ))}
      {status && <p role="status" className="text-body-sm text-text-secondary">{status}</p>}
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

