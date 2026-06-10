import Link from "next/link";

import AuthCard from "@/components/auth/AuthCard";
import PasswordResetRequest from "@/components/auth/PasswordResetRequest";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="We will send a single-use link if the account exists."
      footer={<Link href="/login" className="text-interactive-primary">Back to sign in</Link>}
    >
      <PasswordResetRequest />
    </AuthCard>
  );
}

