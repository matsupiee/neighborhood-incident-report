import { moderatorProcedure } from "../../index";
import { moderationApproveSchema, moderationRejectSchema } from "./_schemas";
import {
  approvePost,
  banUser,
  listPendingPosts,
  rejectPost,
} from "./moderation.service";

export const moderationRouter = {
  listPending: moderatorProcedure.handler(async () => {
    return await listPendingPosts();
  }),

  approve: moderatorProcedure
    .input(moderationApproveSchema)
    .handler(async ({ input }) => {
      return await approvePost(input);
    }),

  reject: moderatorProcedure
    .input(moderationRejectSchema)
    .handler(async ({ input }) => {
      return await rejectPost(input);
    }),

  banUser: moderatorProcedure.handler(async () => {
    return await banUser();
  }),
};
