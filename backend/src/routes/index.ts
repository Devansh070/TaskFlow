import { Router } from "express";
import authRoutes from "./auth.routes";
import boardRoutes from "./board.routes";
import cardRoutes from "./card.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/boards", boardRoutes);
router.use("/cards", cardRoutes);

export default router;