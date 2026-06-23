import Link from "next/link";

import { confirmEmailChange } from "@/actions/user";
import AuthCard from "@/components/auth/AuthCard";

export default async function VerifyEmailChangePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const parameters = await searchParams;
  const result =
    parameters.email && parameters.token
      ? await confirmEmailChange({ email: parameters.email, token: parameters.token })
      : { success: false as const, error: "Invalid email-change link." };

  return (
    <AuthCard
      title={result.success ? "Email address updated" : "Email change did not work"}
      description={
        result.success
          ? "Your InterLog account now uses your new verified email address."
          : result.error
      }
      footer={<Link href="/settings" className="text-interactive-primary">Back to settings</Link>}
    >
      <Link
        href="/settings"
        className="flex min-h-touch-target items-center justify-center rounded-md bg-interactive-primary px-ds-16 text-label text-text-inverse"
      >
        Return to settings
      </Link>
    </AuthCard>
  );
}
