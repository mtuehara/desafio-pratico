import "server-only";

import { createTRPCRouter, publicProcedure } from "./trpc";
import { createTasksRouter } from "@/features/tasks/server/task-router";
import { taskStore } from "@/features/tasks/server/task-store";

export const appRouter = createTRPCRouter({
  status: publicProcedure.query(() => ({ ok: true })),
  tasks: createTasksRouter(taskStore),
});

export type AppRouter = typeof appRouter;
