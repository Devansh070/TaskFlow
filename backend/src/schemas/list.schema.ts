import { z } from "zod";

export const createListSchema = z.object({
  title: z.string().min(1),
  position: z.number(),
});

export const updateListSchema = z.object({
  title: z.string().min(1).optional(),
  position: z.number().optional(),
});