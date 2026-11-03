import { randomUUID } from "node:crypto";
import type { Tarefa, TarefaInput } from "@/shared/tarefa";

export function criarTarefasStore() {
  const tarefas = new Map<string, Tarefa>();

  return {
    listar(): Tarefa[] {
      return Array.from(tarefas.values(), (tarefa) => ({ ...tarefa })).sort(
        (a, b) => b.dataCriacao - a.dataCriacao || a.id.localeCompare(b.id),
      );
    },
    obter(id: string): Tarefa | undefined {
      const tarefa = tarefas.get(id);
      return tarefa ? { ...tarefa } : undefined;
    },
    criar(input: TarefaInput): Tarefa {
      const tarefa: Tarefa = {
        id: randomUUID(),
        titulo: input.titulo,
        descricao: input.descricao,
        dataCriacao: Date.now(),
      };
      tarefas.set(tarefa.id, tarefa);
      return { ...tarefa };
    },
    atualizar(id: string, input: TarefaInput): Tarefa | undefined {
      const atual = tarefas.get(id);
      if (!atual) return undefined;

      const tarefa = { ...atual, titulo: input.titulo, descricao: input.descricao };
      tarefas.set(id, tarefa);
      return { ...tarefa };
    },
    deletar(id: string): boolean {
      return tarefas.delete(id);
    },
  };
}

export type TarefasStore = ReturnType<typeof criarTarefasStore>;

// Página SSR e API usam a mesma instância no processo, inclusive após recargas de módulos.
const globalForTarefas = globalThis as typeof globalThis & { tarefasStore?: TarefasStore };
export const tarefasStore = globalForTarefas.tarefasStore ??= criarTarefasStore();
