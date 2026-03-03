import z from "zod";

export const moderationBanUserSchema = z.object({
  userId: z.string(),
  reason: z.string().min(1).max(500),
});

export type ModerationBanUserInput = z.infer<typeof moderationBanUserSchema>;

export const moderationUnbanUserSchema = z.object({
  userId: z.string(),
});

export type ModerationUnbanUserInput = z.infer<typeof moderationUnbanUserSchema>;
