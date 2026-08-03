import { prisma } from "../lib/prisma";
import { assertBoardMembership } from "./board.service";
import { AppError } from "../middleware/errorHandler";

export async function createList(boardId: string, userId: string, title: string, position: number) {
  await assertBoardMembership(boardId, userId);
  return prisma.list.create({ data: { boardId, title, position } });
}

async function getListOrThrow(listId: string, userId: string) {
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) throw new AppError("List not found", 404, "LIST_NOT_FOUND");
  await assertBoardMembership(list.boardId, userId);
  return list;
}

export async function updateList(
  listId: string,
  userId: string,
  data: { title?: string; position?: number },
) {
  await getListOrThrow(listId, userId);
  return prisma.list.update({ where: { id: listId }, data });
}

export async function deleteList(listId: string, userId: string) {
  const list = await getListOrThrow(listId, userId);
  await prisma.list.delete({ where: { id: listId } });
  return list;
}