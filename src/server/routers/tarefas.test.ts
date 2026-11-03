import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { criarTarefasStore } from "../tarefas-store";
import { criarTarefasRouter } from "./tarefas";

describe("procedures de tarefas", () => {
  let caller: ReturnType<ReturnType<typeof criarTarefasRouter>["createCaller"]>;

  beforeEach(() => {
    caller = criarTarefasRouter(criarTarefasStore()).createCaller({});
  });

  it("cria, lista, busca, atualiza e exclui uma tarefa", async () => {
    expect(await caller.listar()).toEqual([]);
    const criada = await caller.criar({ titulo: "  Estudar  ", descricao: "  Next.js  " });
    expect(criada).toMatchObject({ titulo: "Estudar", descricao: "Next.js" });
    expect(await caller.listar()).toEqual([criada]);
    expect(await caller.obter({ id: criada.id })).toEqual(criada);

    expect(await caller.atualizar({ id: criada.id, titulo: "Revisar" })).toEqual({
      ...criada, titulo: "Revisar", descricao: undefined,
    });
    expect(await caller.deletar({ id: criada.id })).toEqual({ id: criada.id });
    expect(await caller.listar()).toEqual([]);
  });

  it("rejeita criação vazia sem alterar a lista", async () => {
    await expect(caller.criar({ titulo: "   " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await caller.listar()).toEqual([]);
  });

  it("preserva a tarefa quando uma edição é inválida", async () => {
    const tarefa = await caller.criar({ titulo: "Original" });
    await expect(caller.atualizar({ id: tarefa.id, titulo: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await caller.obter({ id: tarefa.id })).toEqual(tarefa);
  });

  it("rejeita ID malformado", async () => {
    await expect(caller.obter({ id: "errado" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("retorna NOT_FOUND na busca de tarefa inexistente", async () => {
    await expect(caller.obter({ id: randomUUID() })).rejects.toMatchObject({
      code: "NOT_FOUND", message: "Tarefa não encontrada.",
    });
  });

  it("retorna NOT_FOUND na edição de tarefa inexistente", async () => {
    await expect(caller.atualizar({ id: randomUUID(), titulo: "Nova" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("retorna NOT_FOUND na exclusão de tarefa inexistente", async () => {
    await expect(caller.deletar({ id: randomUUID() })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
