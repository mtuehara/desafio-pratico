import { TRPCError } from "@trpc/server";
import { atualizarTarefaSchema, tarefaIdSchema, tarefaInputSchema } from "@/shared/tarefa";
import type { TarefasStore } from "../tarefas-store";
import { createTRPCRouter, publicProcedure } from "../trpc";

function tarefaNaoEncontrada(): never {
  throw new TRPCError({ code: "NOT_FOUND", message: "Tarefa não encontrada." });
}

export function criarTarefasRouter(store: TarefasStore) {
  return createTRPCRouter({
    listar: publicProcedure.query(() => store.listar()),

    obter: publicProcedure.input(tarefaIdSchema).query(({ input }) =>
      store.obter(input.id) ?? tarefaNaoEncontrada(),
    ),

    criar: publicProcedure.input(tarefaInputSchema).mutation(({ input }) => store.criar(input)),

    atualizar: publicProcedure.input(atualizarTarefaSchema).mutation(({ input }) =>
      store.atualizar(input.id, input) ?? tarefaNaoEncontrada(),
    ),

    deletar: publicProcedure.input(tarefaIdSchema).mutation(({ input }) => {
      if (!store.deletar(input.id)) tarefaNaoEncontrada();
      return { id: input.id };
    }),
  });
}
