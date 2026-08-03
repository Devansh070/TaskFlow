import { Router } from "express";
import * as listController from "../controllers/list.controller";
import { validate } from "../middleware/validate";
import { createListSchema, updateListSchema } from "../schemas/list.schema";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router({ mergeParams: true });

router.post("/", validate(createListSchema), asyncHandler(listController.createList));
router.patch("/:listId", validate(updateListSchema), asyncHandler(listController.updateList));
router.delete("/:listId", asyncHandler(listController.deleteList));

export default router;