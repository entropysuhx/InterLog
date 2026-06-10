"use client";

import { createContext, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useGuest } from "@/hooks/useGuest";
import { CATEGORY_NAMES, type ActivityView, type ProductSnapshot } from "@/types";

type ProductDataContextValue = ProductSnapshot & {
  isAuthenticated: boolean;
  isReady: boolean;
  refresh: () => void;
};

const ProductDataContext = createContext<ProductDataContextValue | null>(null);

export default function ProductDataProvider({
  children,
  initialSnapshot,
  isAuthenticated,
}: {
  children: React.ReactNode;
  initialSnapshot: ProductSnapshot | null;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const guest = useGuest();
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
    isAuthenticated && initialSnapshot
      ? {
          ...initialSnapshot,
          isAuthenticated: true,
          isReady: true,
          refresh: () => router.refresh(),
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
          refresh: guest.refresh,
        };

  return <ProductDataContext.Provider value={value}>{children}</ProductDataContext.Provider>;
}

export function useProductData() {
  const context = useContext(ProductDataContext);
  if (!context) throw new Error("useProductData must be used inside ProductDataProvider.");
  return context;
}
