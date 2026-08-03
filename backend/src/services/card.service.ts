import { prisma } from "../lib/prisma";
import { assertBoardMembership } from "./board.service";
import { AppError } from "../middleware/errorHandler";

async function getCardOrThrow(cardId: string, userId: string) {
  const card = await prisma.card.findUnique({ where: { id: cardId }, include: { list: true } });
  if (!card) throw new AppError("Card not found", 404, "CARD_NOT_FOUND");
  await assertBoardMembership(card.list.boardId, userId);
  return card;
}

export async function createCard(
  userId: string,
  data: {
    listId: string;
    title: string;
    description?: string;
    dueDate?: string;
    assigneeId?: string;
    position: number;
  },
) {
  const list = await prisma.list.findUnique({ where: { id: data.listId } });
  if (!list) throw new AppError("List not found", 404, "LIST_NOT_FOUND");
  await assertBoardMembership(list.boardId, userId);

  return prisma.card.create({
    data: {
      listId: data.listId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      assigneeId: data.assigneeId,
      position: data.position,
    },
  });
}

export async function updateCard(
  cardId: string,
  userId: string,
  data: {
    listId?: string;
    title?: string;
    description?: string | null;
    dueDate?: string | null;
    assigneeId?: string | null;
    position?: number;
  },
) {
  await getCardOrThrow(cardId, userId);

  return prisma.card.update({
    where: { id: cardId },
    data: {
      ...data,
      dueDate: data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null,
    },
  });
}

export async function deleteCard(cardId: string, userId: string) {
  const card = await getCardOrThrow(cardId, userId);
  await prisma.card.delete({ where: { id: cardId } });
  return card; // includes `.list` (with boardId), from getCardOrThrow's include
}