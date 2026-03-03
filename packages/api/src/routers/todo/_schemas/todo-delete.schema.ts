import z from "zod";

export const todoDeleteSchema = z.object({
  id: z.number(),
});

export type TodoDeleteInput = z.infer<typeof todoDeleteSchema>;
