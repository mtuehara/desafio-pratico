import { describe, expect, it } from "vitest";
import { atualizarTarefaSchema, tarefaIdSchema, tarefaInputSchema } from "./tarefa";

describe("validação de tarefas", () => {
  it.each([undefined, null, "", "   ", "\n\t", 123])("rejeita título inválido: %s", (titulo) => {
    expect(tarefaInputSchema.safeParse({ titulo }).success).toBe(false);
  });

  it("normaliza os campos de texto", () => {
    expect(tarefaInputSchema.parse({ titulo: "  Estudar  ", descricao: "  tRPC  " })).toEqual({
      titulo: "Estudar", descricao: "tRPC",
    });
  });

  it.each([undefined, "", "   "])("aceita descrição opcional: %s", (descricao) => {
    expect(tarefaInputSchema.parse({ titulo: "Estudar", descricao }).descricao).toBeUndefined();
  });

  it("descarta campos que devem ser gerados pelo servidor", () => {
    expect(tarefaInputSchema.parse({ titulo: "Estudar", id: "forjado", dataCriacao: 0 })).toEqual({
      titulo: "Estudar",
    });
  });

  it("rejeita identificador inválido", () => {
    expect(tarefaIdSchema.safeParse({ id: "inexistente" }).success).toBe(false);
  });

  it("exige título e ID para atualizar", () => {
    expect(atualizarTarefaSchema.safeParse({ titulo: "Estudar" }).success).toBe(false);
    expect(atualizarTarefaSchema.safeParse({ id: "a3d08168-87a6-4b41-b488-96c8375ac2ee" }).success).toBe(false);
  });
});
