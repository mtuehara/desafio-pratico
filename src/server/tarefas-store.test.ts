import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarTarefasStore } from "./tarefas-store";

describe("armazenamento de tarefas", () => {
  let store: ReturnType<typeof criarTarefasStore>;

  beforeEach(() => {
    store = criarTarefasStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-03T12:00:00Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("começa vazio e mantém instâncias independentes", () => {
    store.criar({ titulo: "Uma tarefa" });
    expect(criarTarefasStore().listar()).toEqual([]);
  });

  it("gera IDs únicos e timestamp no servidor", () => {
    const primeira = store.criar({ titulo: "Primeira" });
    const segunda = store.criar({ titulo: "Segunda" });
    expect(primeira.id).not.toBe(segunda.id);
    expect(primeira.dataCriacao).toBe(Date.now());
    expect(store.obter(primeira.id)).toEqual(primeira);
  });

  it("ordena por criação decrescente com desempate por ID", () => {
    const antiga = store.criar({ titulo: "Antiga" });
    vi.advanceTimersByTime(1000);
    const a = store.criar({ titulo: "A" });
    const b = store.criar({ titulo: "B" });
    expect(store.listar().map((tarefa) => tarefa.id)).toEqual([
      ...[a.id, b.id].sort((x, y) => x.localeCompare(y)), antiga.id,
    ]);
  });

  it("altera apenas os campos editáveis e permite limpar a descrição", () => {
    const original = store.criar({ titulo: "Antiga", descricao: "Descrição" });
    vi.advanceTimersByTime(1000);
    expect(store.atualizar(original.id, { titulo: "Nova" })).toEqual({
      ...original, titulo: "Nova", descricao: undefined,
    });
  });

  it("não expõe referências internas nas respostas", () => {
    const criada = store.criar({ titulo: "Original" });
    criada.titulo = "Alterada na criação";
    store.listar()[0].titulo = "Alterada na listagem";
    const encontrada = store.obter(criada.id)!;
    encontrada.titulo = "Alterada na busca";
    const atualizada = store.atualizar(criada.id, { titulo: "Atualizada" })!;
    atualizada.titulo = "Alterada na edição";
    expect(store.obter(criada.id)?.titulo).toBe("Atualizada");
  });

  it("remove uma tarefa existente", () => {
    const tarefa = store.criar({ titulo: "Excluir" });
    expect(store.deletar(tarefa.id)).toBe(true);
    expect(store.obter(tarefa.id)).toBeUndefined();
    expect(store.listar()).toEqual([]);
  });

  it("informa ausência sem criar tarefas durante uma atualização", () => {
    expect(store.obter("ausente")).toBeUndefined();
    expect(store.atualizar("ausente", { titulo: "Nova" })).toBeUndefined();
    expect(store.deletar("ausente")).toBe(false);
    expect(store.listar()).toEqual([]);
  });
});
