import { moderatorProcedure } from "../../index";
import {
  moderationApproveSchema,
  moderationBanUserSchema,
  moderationRejectSchema,
  moderationUnbanUserSchema,
} from "./_schemas";
import {
  approvePost,
  banUser,
  listPendingPosts,
  rejectPost,
  unbanUser,
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

  banUser: moderatorProcedure
    .input(moderationBanUserSchema)
    .handler(async ({ input }) => {
      return await banUser(input);
    }),

  unbanUser: moderatorProcedure
    .input(moderationUnbanUserSchema)
    .handler(async ({ input }) => {
      return await unbanUser(input);
    }),
};
