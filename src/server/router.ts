import "server-only";

import { createTRPCRouter, publicProcedure } from "./trpc";
import { criarTarefasRouter } from "./routers/tarefas";
import { tarefasStore } from "./tarefas-store";

export const appRouter = createTRPCRouter({
  status: publicProcedure.query(() => ({ ok: true })),
  tarefas: criarTarefasRouter(tarefasStore),
});

export type AppRouter = typeof appRouter;
