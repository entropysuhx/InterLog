import type { ReactNode } from "react";

import AppShell from "@/components/layout/AppShell";
import { getProductSnapshot } from "@/lib/data/product-snapshot";

export default async function ProductLayout({ children }: { children: ReactNode }) {
  const viewer = await getProductSnapshot();
  return (
    <AppShell
      initialSnapshot={viewer.snapshot}
      isAuthenticated={viewer.isAuthenticated}
      userName={viewer.userName}
      userImage={viewer.userImage}
    >
      {children}
    </AppShell>
  );
}
