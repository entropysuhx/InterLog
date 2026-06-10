"use client";

import { useCallback, useEffect, useState } from "react";

import { guestStore } from "@/lib/guest/store";
import type { GuestActivity, GuestFocusSession, GuestReflection } from "@/types";

export function useGuest() {
  const [activities, setActivities] = useState<GuestActivity[]>([]);
  const [reflections, setReflections] = useState<GuestReflection[]>([]);
  const [activeFocusSession, setActiveFocusSession] = useState<GuestFocusSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const refresh = useCallback(() => {
    setActivities(guestStore.getActivities());
    setReflections(guestStore.getReflections());
    setActiveFocusSession(guestStore.getActiveFocusSession());
  }, []);

  useEffect(() => {
    refresh();
    setIsHydrated(true);
  }, [refresh]);

  return { activities, reflections, activeFocusSession, isHydrated, refresh };
}

