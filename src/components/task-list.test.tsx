// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "@/shared/task";
import { TaskList } from "./task-list";

const api = vi.hoisted(() => ({ list: vi.fn(), delete: vi.fn() }));

vi.mock("@/trpc/client", () => ({
  useTRPC: () => ({
    tasks: {
      list: {
        queryOptions: () => ({ queryKey: ["tasks"], queryFn: api.list }),
        queryKey: () => ["tasks"],
      },
      delete: {
        mutationOptions: (options: object) => ({ ...options, mutationFn: api.delete }),
      },
    },
  }),
}));

const task: Task = {
  id: "a3d08168-87a6-4b41-b488-96c8375ac2ee",
  title: "Preparar entrevista", description: "Revisar tRPC",
  createdAt: Date.parse("2026-11-03T12:00:00Z"),
};

function renderTaskList(tasks: Task[] = [task]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskList initialTasks={tasks} />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);
beforeEach(() => {
  api.list.mockReset();
  api.list.mockResolvedValue([task]);
  api.delete.mockReset();
  api.delete.mockResolvedValue({ id: task.id });
});

describe("task list", () => {
  it("shows initial data without waiting for a browser query", () => {
    renderTaskList();
    expect(screen.getByRole("heading", { name: task.title })).toBeTruthy();
    expect(screen.getByText("Revisar tRPC")).toBeTruthy();
    expect(screen.getByText(/03\/11\/2026, 09:00/)).toBeTruthy();
    expect(api.list).not.toHaveBeenCalled();
  });

  it("shows the empty state", () => {
    renderTaskList([]);
    expect(screen.getByText("Nenhuma tarefa cadastrada.")).toBeTruthy();
  });

  it("refreshes the list with API results", async () => {
    api.list.mockResolvedValue([]);
    renderTaskList();
    await userEvent.click(screen.getByRole("button", { name: "Atualizar lista" }));
    await screen.findByText("Nenhuma tarefa cadastrada.");
    expect(screen.queryByRole("heading", { name: task.title })).toBeNull();
  });

  it("preserves existing data and reports a failed refresh", async () => {
    api.list.mockRejectedValue(new Error("Falha na rede"));
    renderTaskList();
    await userEvent.click(screen.getByRole("button", { name: "Atualizar lista" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Não foi possível atualizar"));
    expect(screen.getByRole("heading", { name: task.title })).toBeTruthy();
  });

  it("removes the card and reports a successful deletion", async () => {
    api.list.mockResolvedValue([]);
    renderTaskList();
    await userEvent.click(screen.getByRole("button", { name: `Excluir ${task.title}` }));
    await screen.findByText("Tarefa excluída com sucesso.");
    expect(screen.queryByRole("heading", { name: task.title })).toBeNull();
    expect(api.delete.mock.calls[0][0]).toEqual({ id: task.id });
  });

  it("preserves the card and reports a failed deletion", async () => {
    api.delete.mockRejectedValue(new Error("Tarefa não encontrada."));
    renderTaskList();
    await userEvent.click(screen.getByRole("button", { name: `Excluir ${task.title}` }));
    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toBe("Tarefa não encontrada.");
    expect(screen.getByRole("heading", { name: task.title })).toBeTruthy();
  });

  it("prevents duplicate deletions while a request is pending", async () => {
    const operation = Promise.withResolvers<{ id: string }>();
    api.delete.mockReturnValue(operation.promise);
    api.list.mockResolvedValue([]);
    renderTaskList();
    const button = screen.getByRole("button", { name: `Excluir ${task.title}` });
    await userEvent.click(button);
    expect(button).toHaveProperty("disabled", true);
    expect(button.textContent).toBe("Excluindo…");
    await userEvent.click(button);
    expect(api.delete).toHaveBeenCalledTimes(1);
    await act(async () => { operation.resolve({ id: task.id }); });
    await screen.findByText("Tarefa excluída com sucesso.");
  });
});
