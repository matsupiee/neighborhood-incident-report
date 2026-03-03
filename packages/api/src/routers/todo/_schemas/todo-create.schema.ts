import z from "zod";

export const todoCreateSchema = z.object({
  text: z.string().min(1),
});

export type TodoCreateInput = z.infer<typeof todoCreateSchema>;
