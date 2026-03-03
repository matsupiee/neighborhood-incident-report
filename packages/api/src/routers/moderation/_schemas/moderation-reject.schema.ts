import z from "zod";

export const moderationRejectSchema = z.object({
  postId: z.string().min(1),
});

export type ModerationRejectInput = z.infer<typeof moderationRejectSchema>;
