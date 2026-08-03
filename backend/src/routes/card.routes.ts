import { Router } from "express";
import * as cardController from "../controllers/card.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createCardSchema, updateCardSchema } from "../schemas/card.schema";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post("/", validate(createCardSchema), asyncHandler(cardController.createCard));
router.patch("/:cardId", validate(updateCardSchema), asyncHandler(cardController.updateCard));
router.delete("/:cardId", asyncHandler(cardController.deleteCard));

export default router;