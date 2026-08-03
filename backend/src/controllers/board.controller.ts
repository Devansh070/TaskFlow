import { Request, Response } from "express";
import * as boardService from "../services/board.service";

export async function createBoard(req: Request, res: Response) {
  const board = await boardService.createBoard(req.userId!, req.body.name);
  res.status(201).json({ board });
}

export async function listBoards(req: Request, res: Response) {
  const boards = await boardService.getBoardsForUser(req.userId!);
  res.status(200).json({ boards });
}

export async function getBoard(req: Request, res: Response) {
  const board = await boardService.getBoardById(req.params.boardId, req.userId!);
  res.status(200).json({ board });
}

export async function addMember(req: Request, res: Response) {
  await boardService.addMember(req.params.boardId, req.userId!, req.body.email);
  res.status(204).send();
}