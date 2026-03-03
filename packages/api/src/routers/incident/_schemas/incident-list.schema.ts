import z from "zod";

export const incidentListSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  categoryId: z.string().min(1).optional(),
});

export type IncidentListInput = z.infer<typeof incidentListSchema>;
