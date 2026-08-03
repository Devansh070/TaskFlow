import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export async function createBoard(ownerId: string, name: string) {
  return prisma.board.create({
    data: {
      name,
      ownerId,
      members: { create: { userId: ownerId } },
    },
  });
}

export async function getBoardsForUser(userId: string) {
  return prisma.board.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "desc" },
  });
}

// Throws if the board doesn't exist or the user isn't a member — used to guard every board sub-resource.
export async function assertBoardMembership(boardId: string, userId: string) {
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  if (!membership) {
    throw new AppError("Board not found", 404, "BOARD_NOT_FOUND");
  }
}

export async function getBoardById(boardId: string, userId: string) {
  await assertBoardMembership(boardId, userId);
  return prisma.board.findUnique({
    where: { id: boardId },
    include: {
      lists: { orderBy: { position: "asc" }, include: { cards: { orderBy: { position: "asc" } } } },
      members: { include: { user: { select: { id: true, email: true, name: true } } } },
    },
  });
}

export async function addMember(boardId: string, requesterId: string, email: string) {
  await assertBoardMembership(boardId, requesterId);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("No user found with that email", 404, "USER_NOT_FOUND");
  }

  return prisma.boardMember.upsert({
    where: { boardId_userId: { boardId, userId: user.id } },
    update: {},
    create: { boardId, userId: user.id },
  });
}