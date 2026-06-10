import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { id: "cat_deepwork", key: "deep-work", name: "Deep Work", icon: "brain", sortOrder: 1 },
  { id: "cat_learning", key: "learning", name: "Learning", icon: "book-open", sortOrder: 2 },
  { id: "cat_reflection", key: "reflection", name: "Reflection", icon: "notebook", sortOrder: 3 },
  { id: "cat_exercise", key: "exercise", name: "Exercise", icon: "dumbbell", sortOrder: 4 },
  { id: "cat_social", key: "social", name: "Social", icon: "users", sortOrder: 5 },
  { id: "cat_meeting", key: "meeting", name: "Meeting", icon: "video", sortOrder: 6 },
  { id: "cat_admin", key: "admin", name: "Admin", icon: "inbox", sortOrder: 7 },
  { id: "cat_break", key: "break", name: "Break", icon: "coffee", sortOrder: 8 },
  { id: "cat_personal", key: "personal", name: "Personal", icon: "heart", sortOrder: 9 },
] as const;

async function main(): Promise<void> {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
