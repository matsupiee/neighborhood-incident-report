import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { incidentRouter } from "./incident/incident.router";
import { moderationRouter } from "./moderation/moderation.router";
import { todoRouter } from "./todo/todo.router";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  todo: todoRouter,
  incident: incidentRouter,
  moderation: moderationRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
