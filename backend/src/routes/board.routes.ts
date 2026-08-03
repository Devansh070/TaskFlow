import { Router } from "express";
import * as boardController from "../controllers/board.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createBoardSchema, addMemberSchema } from "../schemas/board.schema";
import { asyncHandler } from "../utils/asyncHandler";
import listRoutes from "./list.routes";
import * as activityController from "../controllers/activity.controller";

const router = Router();

router.use(requireAuth);

router.post("/", validate(createBoardSchema), asyncHandler(boardController.createBoard));
router.get("/", asyncHandler(boardController.listBoards));
router.get("/:boardId", asyncHandler(boardController.getBoard));
router.post(
  "/:boardId/members",
  validate(addMemberSchema),
  asyncHandler(boardController.addMember),
);
router.get("/:boardId/activity", asyncHandler(activityController.getActivity));

router.use("/:boardId/lists", listRoutes);

export default router;