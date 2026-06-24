"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useGuest } from "@/hooks/useGuest";
import { CATEGORY_NAMES, type ActivityView, type ProductSnapshot } from "@/types";

type ProductDataContextValue = ProductSnapshot & {
  isAuthenticated: boolean;
  isReady: boolean;
  userName: string | null;
  userImage: string | null;
  refresh: () => void;
};

const ProductDataContext = createContext<ProductDataContextValue | null>(null);

export default function ProductDataProvider({
  children,
  initialSnapshot,
  isAuthenticated,
  userName,
  userImage,
}: {
  children: React.ReactNode;
  initialSnapshot: ProductSnapshot | null;
  isAuthenticated: boolean;
  userName: string | null;
  userImage: string | null;
}) {
  const router = useRouter();
  const guest = useGuest();
  const [authenticatedData, setAuthenticatedData] = useState({
    snapshot: initialSnapshot,
    userName,
    userImage,
  });

  useEffect(() => {
    setAuthenticatedData({ snapshot: initialSnapshot, userName, userImage });
  }, [initialSnapshot, userImage, userName]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      guest.refresh();
      return;
    }

    try {
      const response = await fetch("/api/product-snapshot", { cache: "no-store" });
      if (!response.ok) throw new Error(`Snapshot request failed with ${response.status}.`);
      const next = (await response.json()) as {
        snapshot: ProductSnapshot;
        userName: string | null;
        userImage: string | null;
      };
      setAuthenticatedData(next);
    } catch (error) {
      console.error("Failed to refresh product data", error);
    } finally {
      router.refresh();
    }
  }, [guest, isAuthenticated, router]);
  const guestActivities = useMemo<ActivityView[]>(
    () =>
      guest.activities.map((activity) => ({
        ...activity,
        categoryName: CATEGORY_NAMES[activity.categoryKey],
      })),
    [guest.activities],
  );
  const guestReflectionDays = useMemo(
    () => new Set(guest.reflections.map((reflection) => reflection.activityDate)).size,
    [guest.reflections],
  );

  const value: ProductDataContextValue =
    isAuthenticated && authenticatedData.snapshot
      ? {
          ...authenticatedData.snapshot,
          isAuthenticated: true,
          isReady: true,
          userName: authenticatedData.userName,
          userImage: authenticatedData.userImage,
          refresh,
        }
      : {
          activities: guestActivities,
          activeFocusSession: guest.activeFocusSession,
          reflectionDays: guestReflectionDays,
          insights: [],
          reflections: guest.reflections.map((reflection) => ({
            id: reflection.id,
            activityDate: reflection.activityDate,
            prompt: reflection.prompt,
            answer: reflection.answer,
            updatedAt: reflection.updatedAt,
          })),
          isAuthenticated: false,
          isReady: guest.isHydrated,
          userName: null,
          userImage: null,
          weekStartsOn: 1,
          refresh,
        };

  return <ProductDataContext.Provider value={value}>{children}</ProductDataContext.Provider>;
}

export function useProductData() {
  const context = useContext(ProductDataContext);
  if (!context) throw new Error("useProductData must be used inside ProductDataProvider.");
  return context;
}
