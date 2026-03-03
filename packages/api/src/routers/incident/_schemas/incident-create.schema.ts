import z from "zod";

const TIME_RANGE_VALUES = [
  "MIDNIGHT",
  "MORNING",
  "DAYTIME",
  "EVENING",
  "NIGHT_EARLY",
  "NIGHT_LATE",
] as const;

export const incidentCreateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  description: z.string().min(1).max(200),
  timeRange: z.enum(TIME_RANGE_VALUES),
  categoryIds: z.array(z.string().min(1)).min(1).max(5),
  imageUrl: z.string().optional(),
});

export type IncidentCreateInput = z.infer<typeof incidentCreateSchema>;
