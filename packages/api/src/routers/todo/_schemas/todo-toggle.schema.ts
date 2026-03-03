import z from "zod";

export const todoToggleSchema = z.object({
  id: z.number(),
  completed: z.boolean(),
});

export type TodoToggleInput = z.infer<typeof todoToggleSchema>;
