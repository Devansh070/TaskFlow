import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@taskflow.dev" },
    update: {},
    create: {
      email: "demo@taskflow.dev",
      passwordHash,
      name: "Demo User",
    },
  });

  const board = await prisma.board.create({
    data: {
      name: "Demo Board",
      ownerId: user.id,
      members: { create: { userId: user.id } },
    },
  });

  const [todo, inProgress, done] = await Promise.all([
    prisma.list.create({ data: { boardId: board.id, title: "To Do", position: 1 } }),
    prisma.list.create({ data: { boardId: board.id, title: "In Progress", position: 2 } }),
    prisma.list.create({ data: { boardId: board.id, title: "Done", position: 3 } }),
  ]);

  await prisma.card.createMany({
    data: [
      { listId: todo.id, title: "Set up project", position: 1 },
      { listId: todo.id, title: "Design database schema", position: 2 },
      { listId: inProgress.id, title: "Build auth endpoints", position: 1 },
      { listId: done.id, title: "Initialize repo", position: 1 },
    ],
  });

  console.log("Seed complete. Login with demo@taskflow.dev / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });