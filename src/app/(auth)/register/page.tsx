import Link from "next/link";

import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Keep your history safe"
      description="Create an account to sync your timeline and preserve your guest data."
      footer={<>Already have an account? <Link href="/login" className="text-interactive-primary">Sign in</Link></>}
    >
      <RegisterForm />
    </AuthCard>
  );
}

