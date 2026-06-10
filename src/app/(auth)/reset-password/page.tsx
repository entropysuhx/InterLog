import Link from "next/link";

import AuthCard from "@/components/auth/AuthCard";
import PasswordResetForm from "@/components/auth/PasswordResetForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const parameters = await searchParams;
  return (
    <AuthCard
      title="Choose a new password"
      description="Use at least eight characters."
      footer={<Link href="/login" className="text-interactive-primary">Back to sign in</Link>}
    >
      {parameters.email && parameters.token ? (
        <PasswordResetForm email={parameters.email} token={parameters.token} />
      ) : (
        <p role="alert" className="text-body-sm text-status-error">Invalid reset link.</p>
      )}
    </AuthCard>
  );
}

