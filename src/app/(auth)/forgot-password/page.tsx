import Link from "next/link";

import AuthCard from "@/components/auth/AuthCard";
import PasswordResetRequest from "@/components/auth/PasswordResetRequest";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Password reset email will be enabled soon."
      footer={<Link href="/login" className="text-interactive-primary">Back to sign in</Link>}
    >
      <PasswordResetRequest />
    </AuthCard>
  );
}
