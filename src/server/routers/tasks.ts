import { TRPCError } from "@trpc/server";
import { updateTaskSchema, taskIdSchema, taskInputSchema } from "@/shared/task";
import type { TaskStore } from "../task-store";
import { createTRPCRouter, publicProcedure } from "../trpc";

function taskNotFound(): never {
  throw new TRPCError({ code: "NOT_FOUND", message: "Tarefa não encontrada." });
}

export function createTasksRouter(store: TaskStore) {
  return createTRPCRouter({
    list: publicProcedure.query(() => store.list()),

    getById: publicProcedure.input(taskIdSchema).query(({ input }) =>
      store.getById(input.id) ?? taskNotFound(),
    ),

    create: publicProcedure.input(taskInputSchema).mutation(({ input }) => store.create(input)),

    update: publicProcedure.input(updateTaskSchema).mutation(({ input }) =>
      store.update(input.id, input) ?? taskNotFound(),
    ),

    delete: publicProcedure.input(taskIdSchema).mutation(({ input }) => {
      if (!store.delete(input.id)) taskNotFound();
      return { id: input.id };
    }),
  });
}
