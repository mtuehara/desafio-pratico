import "server-only";

import { createTRPCRouter } from "./trpc";
import { createTasksRouter } from "@/features/tasks/server/task-router";
import { taskStore } from "@/features/tasks/server/task-store";

export const appRouter = createTRPCRouter({
  tasks: createTasksRouter(taskStore),
});

export type AppRouter = typeof appRouter;
