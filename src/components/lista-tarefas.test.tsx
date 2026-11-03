// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Tarefa } from "@/shared/tarefa";
import { ListaTarefas } from "./lista-tarefas";

const api = vi.hoisted(() => ({ listar: vi.fn(), deletar: vi.fn() }));

vi.mock("@/trpc/client", () => ({
  useTRPC: () => ({
    tarefas: {
      listar: {
        queryOptions: () => ({ queryKey: ["tarefas"], queryFn: api.listar }),
        queryKey: () => ["tarefas"],
      },
      deletar: {
        mutationOptions: (options: object) => ({ ...options, mutationFn: api.deletar }),
      },
    },
  }),
}));

const tarefa: Tarefa = {
  id: "a3d08168-87a6-4b41-b488-96c8375ac2ee",
  titulo: "Preparar entrevista", descricao: "Revisar tRPC",
  dataCriacao: Date.parse("2026-11-03T12:00:00Z"),
};

function renderLista(tarefas: Tarefa[] = [tarefa]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ListaTarefas tarefasIniciais={tarefas} />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);
beforeEach(() => {
  api.listar.mockReset();
  api.listar.mockResolvedValue([tarefa]);
  api.deletar.mockReset();
  api.deletar.mockResolvedValue({ id: tarefa.id });
});

describe("listagem de tarefas", () => {
  it("mostra os dados iniciais sem aguardar uma consulta do navegador", () => {
    renderLista();
    expect(screen.getByRole("heading", { name: tarefa.titulo })).toBeTruthy();
    expect(screen.getByText("Revisar tRPC")).toBeTruthy();
    expect(screen.getByText(/03\/11\/2026, 09:00/)).toBeTruthy();
    expect(api.listar).not.toHaveBeenCalled();
  });

  it("mostra o estado vazio", () => {
    renderLista([]);
    expect(screen.getByText("Nenhuma tarefa cadastrada.")).toBeTruthy();
  });

  it("atualiza a lista com o resultado da API", async () => {
    api.listar.mockResolvedValue([]);
    renderLista();
    await userEvent.click(screen.getByRole("button", { name: "Atualizar lista" }));
    await screen.findByText("Nenhuma tarefa cadastrada.");
    expect(screen.queryByRole("heading", { name: tarefa.titulo })).toBeNull();
  });

  it("preserva os dados e mostra feedback quando a atualização falha", async () => {
    api.listar.mockRejectedValue(new Error("Falha na rede"));
    renderLista();
    await userEvent.click(screen.getByRole("button", { name: "Atualizar lista" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Não foi possível atualizar"));
    expect(screen.getByRole("heading", { name: tarefa.titulo })).toBeTruthy();
  });

  it("remove o cartão e mostra sucesso após excluir", async () => {
    api.listar.mockResolvedValue([]);
    renderLista();
    await userEvent.click(screen.getByRole("button", { name: `Excluir ${tarefa.titulo}` }));
    await screen.findByText("Tarefa excluída com sucesso.");
    expect(screen.queryByRole("heading", { name: tarefa.titulo })).toBeNull();
    expect(api.deletar.mock.calls[0][0]).toEqual({ id: tarefa.id });
  });

  it("mantém o cartão e mostra o erro quando a exclusão falha", async () => {
    api.deletar.mockRejectedValue(new Error("Tarefa não encontrada."));
    renderLista();
    await userEvent.click(screen.getByRole("button", { name: `Excluir ${tarefa.titulo}` }));
    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toBe("Tarefa não encontrada.");
    expect(screen.getByRole("heading", { name: tarefa.titulo })).toBeTruthy();
  });

  it("bloqueia exclusões enquanto a resposta está pendente", async () => {
    const operacao = Promise.withResolvers<{ id: string }>();
    api.deletar.mockReturnValue(operacao.promise);
    api.listar.mockResolvedValue([]);
    renderLista();
    const botao = screen.getByRole("button", { name: `Excluir ${tarefa.titulo}` });
    await userEvent.click(botao);
    expect(botao).toHaveProperty("disabled", true);
    expect(botao.textContent).toBe("Excluindo…");
    await userEvent.click(botao);
    expect(api.deletar).toHaveBeenCalledTimes(1);
    await act(async () => { operacao.resolve({ id: tarefa.id }); });
    await screen.findByText("Tarefa excluída com sucesso.");
  });
});
