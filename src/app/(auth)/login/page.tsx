import Link from "next/link";

import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to sync your history and access it across devices."
      footer={<>New to InterLog? <Link href="/register" className="text-interactive-primary">Create an account</Link></>}
    >
      <LoginForm />
    </AuthCard>
  );
}

