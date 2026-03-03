import { protectedProcedure } from "../../index";
import { moderationApproveSchema, moderationRejectSchema } from "./_schemas";
import { approvePost, banUser, listPendingPosts, rejectPost } from "./moderation.service";

export const moderationRouter = {
  listPending: protectedProcedure.handler(async () => {
    return await listPendingPosts();
  }),

  approve: protectedProcedure.input(moderationApproveSchema).handler(async ({ input }) => {
    return await approvePost(input);
  }),

  reject: protectedProcedure.input(moderationRejectSchema).handler(async ({ input }) => {
    return await rejectPost(input);
  }),

  banUser: protectedProcedure.handler(async () => {
    return await banUser();
  }),
};
