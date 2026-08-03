import { Request, Response } from "express";
import * as listService from "../services/list.service";
import { logActivity } from "../services/activity.service";
import { emitToBoard } from "../sockets/emit";
import { prisma } from "../lib/prisma";

export async function createList(req: Request, res: Response) {
  const list = await listService.createList(
    req.params.boardId,
    req.userId!,
    req.body.title,
    req.body.position,
  );
  emitToBoard(req.params.boardId, "list:created", list, req.headers["x-client-id"] as string);

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  const entry = await logActivity(
    req.params.boardId,
    req.userId!,
    `${user?.name} added list "${list.title}"`,
    "LIST",
    list.id,
  );
  emitToBoard(req.params.boardId, "activity:created", entry, req.headers["x-client-id"] as string);

  res.status(201).json({ list });
}

export async function updateList(req: Request, res: Response) {
  const list = await listService.updateList(req.params.listId, req.userId!, req.body);
  emitToBoard(list.boardId, "list:updated", list, req.headers["x-client-id"] as string);

  if (req.body.title) {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    const entry = await logActivity(
      list.boardId,
      req.userId!,
      `${user?.name} renamed a list to "${list.title}"`,
      "LIST",
      list.id,
    );
    emitToBoard(list.boardId, "activity:created", entry, req.headers["x-client-id"] as string);
  }

  res.status(200).json({ list });
}

export async function deleteList(req: Request, res: Response) {
  const list = await listService.deleteList(req.params.listId, req.userId!);
  emitToBoard(list.boardId, "list:deleted", { id: list.id }, req.headers["x-client-id"] as string);

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  const entry = await logActivity(
    list.boardId,
    req.userId!,
    `${user?.name} deleted list "${list.title}"`,
    "LIST",
    list.id,
  );
  emitToBoard(list.boardId, "activity:created", entry, req.headers["x-client-id"] as string);

  res.status(204).send();
}