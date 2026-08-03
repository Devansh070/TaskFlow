import { Request, Response } from "express";
import * as cardService from "../services/card.service";
import { logActivity } from "../services/activity.service";
import { emitToBoard } from "../sockets/emit";
import { prisma } from "../lib/prisma";

export async function createCard(req: Request, res: Response) {
  const card = await cardService.createCard(req.userId!, req.body);
  const list = await prisma.list.findUnique({ where: { id: card.listId } });
  if (!list) return res.status(201).json({ card });

  emitToBoard(list.boardId, "card:created", card, req.headers["x-client-id"] as string);

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  const entry = await logActivity(
    list.boardId,
    req.userId!,
    `${user?.name} added card "${card.title}" to ${list.title}`,
    "CARD",
    card.id,
  );
  emitToBoard(list.boardId, "activity:created", entry, req.headers["x-client-id"] as string);

  res.status(201).json({ card });
}

export async function updateCard(req: Request, res: Response) {
  const previousCard = await prisma.card.findUnique({ where: { id: req.params.cardId } });
  const card = await cardService.updateCard(req.params.cardId, req.userId!, req.body);
  const list = await prisma.list.findUnique({ where: { id: card.listId } });
  if (!list) return res.status(200).json({ card });

  emitToBoard(list.boardId, "card:updated", card, req.headers["x-client-id"] as string);

  // Only log a human-readable entry for a card actually moving lists — avoids
  // spamming the feed with every minor reorder-within-list position tweak.
  if (previousCard && previousCard.listId !== card.listId) {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    const entry = await logActivity(
      list.boardId,
      req.userId!,
      `${user?.name} moved "${card.title}" to ${list.title}`,
      "CARD",
      card.id,
    );
    emitToBoard(list.boardId, "activity:created", entry, req.headers["x-client-id"] as string);
  }

  res.status(200).json({ card });
}

export async function deleteCard(req: Request, res: Response) {
  const card = await cardService.deleteCard(req.params.cardId, req.userId!);
  emitToBoard(
    card.list.boardId,
    "card:deleted",
    { id: card.id, listId: card.listId },
    req.headers["x-client-id"] as string,
  );

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  const entry = await logActivity(
    card.list.boardId,
    req.userId!,
    `${user?.name} deleted card "${card.title}"`,
    "CARD",
    card.id,
  );
  emitToBoard(card.list.boardId, "activity:created", entry, req.headers["x-client-id"] as string);

  res.status(204).send();
}