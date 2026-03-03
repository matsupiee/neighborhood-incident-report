import z from "zod";

export const incidentHeatmapSchema = z.object({
  // 任意の期間フィルター（UNIX タイムスタンプ ms）
  since: z.number().int().optional(),
});

export type IncidentHeatmapInput = z.infer<typeof incidentHeatmapSchema>;
