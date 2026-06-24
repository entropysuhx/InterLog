import Link from "next/link";

import { verifyEmail } from "@/actions/auth";
import AuthCard from "@/components/auth/AuthCard";
import ResendVerificationForm from "@/components/auth/ResendVerificationForm";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string; resumed?: string }>;
}) {
  const parameters = await searchParams;
  if (parameters.email && !parameters.token) {
    return (
      <AuthCard
        title="Check your email"
        description={
          parameters.resumed === "1"
            ? "An account with this email is waiting for verification. We sent you a new verification email."
            : "We sent a verification link to your inbox. Open it to finish creating your InterLog account."
        }
        footer={
          <Link href="/login" className="text-interactive-primary">
            Back to sign in
          </Link>
        }
      >
        <div className="space-y-ds-16">
          <p className="rounded-lg bg-surface-subtle p-ds-16 text-body-sm text-text-secondary">
            After verification, you can sign in and choose whether to import guest data from this
            device.
          </p>
          <ResendVerificationForm email={parameters.email} />
        </div>
      </AuthCard>
    );
  }
  const result =
    parameters.email && parameters.token
      ? await verifyEmail({ email: parameters.email, token: parameters.token })
      : { success: false as const, error: "Invalid verification link." };
  return (
    <AuthCard
      title={result.success ? "Email verified" : "Verification did not work"}
      description={
        result.success
          ? "Your account is ready. Sign in to choose whether to import guest data."
          : result.error
      }
      footer={
        <Link href="/dashboard" className="text-interactive-primary">
          Return to guest mode
        </Link>
      }
    >
      <div className="space-y-ds-12">
        <Link
          href="/login"
          className="flex min-h-touch-target items-center justify-center rounded-md bg-interactive-primary px-ds-16 text-label text-text-inverse"
        >
          Continue to sign in
        </Link>
        {!result.success && parameters.email ? (
          <ResendVerificationForm email={parameters.email} />
        ) : null}
      </div>
    </AuthCard>
  );
}
