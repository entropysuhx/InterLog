"use client";

import { useEffect, useMemo, useState } from "react";

import AuthCard from "@/components/auth/AuthCard";
import MigrationPrompt from "@/components/auth/MigrationPrompt";
import { guestStore } from "@/lib/guest/store";

type MigrationGateProps = {
  accountId: string;
  accountEmail: string | null;
};

export default function MigrationGate({ accountId, accountEmail }: MigrationGateProps) {
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const [hasCheckedMigrationState, setHasCheckedMigrationState] = useState(false);
  const accountKeys = useMemo(
    () => [accountId, accountEmail].filter((value): value is string => Boolean(value)),
    [accountEmail, accountId],
  );

  useEffect(() => {
    if (!guestStore.hasMigrationData() || guestStore.hasSkippedMigrationForAny(accountKeys)) {
      window.location.replace("/dashboard");
      return;
    }
    setShouldShowPrompt(true);
    setHasCheckedMigrationState(true);
  }, [accountKeys]);

  if (!hasCheckedMigrationState || !shouldShowPrompt) {
    return <main className="min-h-screen bg-background" aria-label="Checking migration status" />;
  }

  return (
    <AuthCard
      title="Bring your guest history with you"
      description="You stay in control of what is added to your account."
      footer={<span />}
    >
      <MigrationPrompt accountIds={accountKeys} />
    </AuthCard>
  );
}
