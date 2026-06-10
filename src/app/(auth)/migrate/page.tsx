import Link from "next/link";

import AuthCard from "@/components/auth/AuthCard";
import MigrationPrompt from "@/components/auth/MigrationPrompt";

export default function MigratePage() {
  return (
    <AuthCard
      title="Bring your guest history with you"
      description="You stay in control of what is added to your account."
      footer={<Link href="/dashboard" className="text-interactive-primary">Continue without importing</Link>}
    >
      <MigrationPrompt />
    </AuthCard>
  );
}

