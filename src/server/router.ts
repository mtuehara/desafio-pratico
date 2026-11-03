import "server-only";

import { createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  status: publicProcedure.query(() => ({ ok: true })),
});

export type AppRouter = typeof appRouter;
