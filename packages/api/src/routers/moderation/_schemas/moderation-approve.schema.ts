import z from "zod";

export const moderationApproveSchema = z.object({
  postId: z.string().min(1),
});

export type ModerationApproveInput = z.infer<typeof moderationApproveSchema>;
