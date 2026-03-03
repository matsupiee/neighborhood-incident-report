import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";
import { requireModerator as checkModerator } from "./middleware/require-moderator";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

const requireModerator = o.middleware(async ({ context, next }) => {
  await checkModerator(context);
  return next();
});

export const moderatorProcedure = protectedProcedure.use(requireModerator);
