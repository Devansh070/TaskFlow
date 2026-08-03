import { Request, Response } from "express";
import * as activityService from "../services/activity.service";
import { assertBoardMembership } from "../services/board.service";

export async function getActivity(req: Request, res: Response) {
  await assertBoardMembership(req.params.boardId, req.userId!);
  const activity = await activityService.getRecentActivity(req.params.boardId);
  res.status(200).json({ activity });
}