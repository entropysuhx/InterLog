import Link from "next/link";

import { verifyEmail } from "@/actions/auth";
import AuthCard from "@/components/auth/AuthCard";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const parameters = await searchParams;
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
      footer={<Link href="/dashboard" className="text-interactive-primary">Return to guest mode</Link>}
    >
      <Link
        href="/login"
        className="flex min-h-touch-target items-center justify-center rounded-md bg-interactive-primary px-ds-16 text-label text-text-inverse"
      >
        Continue to sign in
      </Link>
    </AuthCard>
  );
}

