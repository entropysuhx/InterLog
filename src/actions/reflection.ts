"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  SaveMoodEntrySchema,
  SaveReflectionSchema,
  SkipReflectionSchema,
  type ActionResult,
  type SaveReflectionInput,
} from "@/types";

export async function saveReflection(
  input: SaveReflectionInput,
): Promise<ActionResult<{ savedCount: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = SaveReflectionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Add a response before saving." };
  try {
    await prisma.$transaction(async (transaction) => {
      for (const answer of parsed.data.answers) {
        await transaction.reflection.upsert({
          where: {
            userId_activityDate_prompt: {
              userId: session.user.id,
              activityDate: parsed.data.activityDate,
              prompt: answer.prompt,
            },
          },
          update: { answer: answer.answer },
          create: { userId: session.user.id, activityDate: parsed.data.activityDate, ...answer },
        });
      }
      await transaction.reflectionDay.upsert({
        where: {
          userId_activityDate: { userId: session.user.id, activityDate: parsed.data.activityDate },
        },
        update: { status: "COMPLETED", completedAt: new Date() },
        create: {
          userId: session.user.id,
          activityDate: parsed.data.activityDate,
          primaryPrompt: parsed.data.answers[0].prompt,
          optionalPrompts: parsed.data.answers.slice(1).map((answer) => answer.prompt),
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
      if (parsed.data.mood) {
        await transaction.moodEntry.upsert({
          where: {
            userId_activityDate: {
              userId: session.user.id,
              activityDate: parsed.data.activityDate,
            },
          },
          update: { mood: parsed.data.mood },
          create: {
            userId: session.user.id,
            activityDate: parsed.data.activityDate,
            mood: parsed.data.mood,
          },
        });
      }
    });
    revalidatePath("/reflection");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    revalidatePath("/wrapped");
    return { success: true, data: { savedCount: parsed.data.answers.length } };
  } catch {
    return {
      success: false,
      error: "We could not save this reflection. Your draft is still here.",
    };
  }
}

export async function skipReflection(input: { activityDate: string }): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = SkipReflectionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid reflection date." };
  await prisma.reflectionDay.upsert({
    where: {
      userId_activityDate: { userId: session.user.id, activityDate: parsed.data.activityDate },
    },
    update: { status: "SKIPPED" },
    create: {
      userId: session.user.id,
      activityDate: parsed.data.activityDate,
      primaryPrompt: "What felt meaningful today?",
      optionalPrompts: [],
      status: "SKIPPED",
    },
  });
  revalidatePath("/reflection");
  return { success: true, data: undefined };
}

export async function saveMoodEntry(input: {
  activityDate: string;
  mood: number;
  note?: string;
}): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = SaveMoodEntrySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid mood entry." };
  await prisma.moodEntry.upsert({
    where: {
      userId_activityDate: { userId: session.user.id, activityDate: parsed.data.activityDate },
    },
    update: { mood: parsed.data.mood, note: parsed.data.note },
    create: { userId: session.user.id, ...parsed.data },
  });
  return { success: true, data: undefined };
}
