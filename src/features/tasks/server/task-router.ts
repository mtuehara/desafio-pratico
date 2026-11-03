import "server-only";

import { TRPCError } from "@trpc/server";
import { updateTaskSchema, taskIdSchema, taskInputSchema, taskPageInputSchema, type TaskPage } from "@/features/tasks/schemas/task.schema";
import type { TaskStore } from "./task-store";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

function taskNotFound(): never {
  throw new TRPCError({ code: "NOT_FOUND", message: "Tarefa não encontrada." });
}

function ensureUniqueTitle(store: TaskStore, title: string, currentId?: string): void {
  const normalizedTitle = title.trim().toLocaleLowerCase("pt-BR");
  const duplicate = store.list().some((task) =>
    task.id !== currentId && task.title.trim().toLocaleLowerCase("pt-BR") === normalizedTitle,
  );
  if (duplicate) {
    throw new TRPCError({ code: "CONFLICT", message: "Já existe uma tarefa com esse título." });
  }
}

export function createTasksRouter(store: TaskStore) {
  return createTRPCRouter({
    list: publicProcedure.query(() => store.list()),

    listPage: publicProcedure.input(taskPageInputSchema).query(({ input }): TaskPage => {
      const { cursor, limit } = input;
      // Compare the ordering tuple instead of looking up a cursor task that may have been deleted.
      const remaining = store.list().filter((task) => !cursor ||
        task.createdAt < cursor.createdAt ||
        (task.createdAt === cursor.createdAt && task.id.localeCompare(cursor.id) > 0),
      );
      const items = remaining.slice(0, limit);
      const last = items.at(-1);
      return {
        items,
        nextCursor: remaining.length > limit && last ? { createdAt: last.createdAt, id: last.id } : undefined,
      };
    }),

    getById: publicProcedure.input(taskIdSchema).query(({ input }) =>
      store.getById(input.id) ?? taskNotFound(),
    ),

    create: publicProcedure.input(taskInputSchema).mutation(({ input }) => {
      ensureUniqueTitle(store, input.title);
      return store.create(input);
    }),

    update: publicProcedure.input(updateTaskSchema).mutation(({ input }) => {
      if (!store.getById(input.id)) taskNotFound();
      ensureUniqueTitle(store, input.title, input.id);
      return store.update(input.id, input) ?? taskNotFound();
    }),

    delete: publicProcedure.input(taskIdSchema).mutation(({ input }) => {
      if (!store.delete(input.id)) taskNotFound();
      return { id: input.id };
    }),
  });
}
