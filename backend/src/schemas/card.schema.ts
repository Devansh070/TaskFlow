import { z } from "zod";

export const createCardSchema = z.object({
  listId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().min(1).optional(),
  position: z.number(),
});

export const updateCardSchema = z.object({
  listId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  position: z.number().optional(),
});