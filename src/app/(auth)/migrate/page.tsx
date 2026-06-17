import MigrationGate from "@/components/auth/MigrationGate";
import { auth } from "@/lib/auth";

export default async function MigratePage() {
  const session = await auth();
  const accountId = session?.user?.id ?? "guest";
  const accountEmail = session?.user?.email?.toLowerCase() ?? null;

  return <MigrationGate accountId={accountId} accountEmail={accountEmail} />;
}
