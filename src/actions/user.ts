"use server";

import { z } from "zod";

import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/types";

const UpdatePreferencesSchema = z
  .object({
    timezone: z.string().min(1).max(64),
    weekStartsOn: z.number().int().min(0).max(6),
    theme: z.enum(["LIGHT", "DARK", "FOCUS"]),
    showMoodInHistory: z.boolean(),
  })
  .strict();

export async function updatePreferences(
  input: z.infer<typeof UpdatePreferencesSchema>,
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = UpdatePreferencesSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid preferences." };
  await prisma.userPreference.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: { userId: session.user.id, ...parsed.data },
  });
  return { success: true, data: undefined };
}

export async function requestDataExport(): Promise<ActionResult<{ downloadUrl: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  return { success: true, data: { downloadUrl: "/api/export" } };
}

export async function deleteAccount(): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  await prisma.user.delete({ where: { id: session.user.id } });
  await signOut({ redirect: false });
  return { success: true, data: undefined };
}

