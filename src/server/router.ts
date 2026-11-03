import "server-only";

import { createTRPCRouter, publicProcedure } from "./trpc";
import { createTasksRouter } from "./routers/tasks";
import { taskStore } from "./task-store";

export const appRouter = createTRPCRouter({
  status: publicProcedure.query(() => ({ ok: true })),
  tasks: createTasksRouter(taskStore),
});

export type AppRouter = typeof appRouter;
