import type { ReactNode } from "react";

import type { ProductSnapshot } from "@/types";

export type AppShellProps = {
  children: ReactNode;
  initialSnapshot: ProductSnapshot | null;
  isAuthenticated: boolean;
  userName: string | null;
};
