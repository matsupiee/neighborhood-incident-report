import { protectedProcedure, publicProcedure } from "../../index";
import {
  incidentCreateSchema,
  incidentHeatmapSchema,
  incidentListSchema,
  incidentReportAbuseSchema,
} from "./_schemas";
import {
  createIncident,
  getHeatmap,
  listCategories,
  listIncidents,
  reportAbuse,
} from "./incident.service";

export const incidentRouter = {
  create: protectedProcedure
    .input(incidentCreateSchema)
    .handler(async ({ input, context }) => {
      return await createIncident(input, context.session.user.id);
    }),

  list: publicProcedure.input(incidentListSchema).handler(async ({ input }) => {
    return await listIncidents(input);
  }),

  getHeatmap: publicProcedure
    .input(incidentHeatmapSchema)
    .handler(async ({ input }) => {
      return await getHeatmap(input);
    }),

  listCategories: publicProcedure.handler(async () => {
    return await listCategories();
  }),

  reportAbuse: protectedProcedure
    .input(incidentReportAbuseSchema)
    .handler(async ({ input, context }) => {
      return await reportAbuse(input, context.session.user.id);
    }),
};
