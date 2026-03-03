import z from "zod";

export const incidentReportAbuseSchema = z.object({
  postId: z.string().min(1),
  reason: z.enum(["PERSONAL_INFO", "FALSE_REPORT", "HARASSMENT", "OTHER"]),
});

export type IncidentReportAbuseInput = z.infer<typeof incidentReportAbuseSchema>;
