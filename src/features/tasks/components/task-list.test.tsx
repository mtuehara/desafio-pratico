// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Task, TaskCursor } from "@/features/tasks/schemas/task.schema";
import { TaskList } from "./task-list";

const api = vi.hoisted(() => ({ list: vi.fn(), delete: vi.fn() }));

vi.mock("@/lib/trpc/client", () => ({
  useTRPC: () => ({
    tasks: {
      pathKey: () => ["tasks"],
      listPage: {
        infiniteQueryOptions: (_input: unknown, options: object) => ({
          ...options, queryKey: ["tasks"], initialPageParam: null,
          queryFn: ({ pageParam }: { pageParam?: TaskCursor | null }) => api.list({ cursor: pageParam }),
        }),
        infiniteQueryKey: () => ["tasks"],
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

function renderTaskList(tasks: Task[] = [task], nextCursor?: TaskCursor) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskList initialPage={{ items: tasks, nextCursor }} />
    </QueryClientProvider>,
  );
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
beforeEach(() => {
  api.list.mockReset();
  api.list.mockResolvedValue({ items: [task] });
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

  it("preserves remaining tasks when reloading after deletion fails", async () => {
    const remaining = { ...task, id: "b3d08168-87a6-4b41-b488-96c8375ac2ee", title: "Remaining task" };
    api.list.mockRejectedValue(new Error("Falha na rede"));
    renderTaskList([task, remaining]);
    await userEvent.click(screen.getByRole("button", { name: `Excluir ${task.title}` }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Não foi possível atualizar"));
    expect(screen.getByRole("heading", { name: remaining.title })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: task.title })).toBeNull();
  });

  it("removes the card and reports a successful deletion", async () => {
    api.list.mockResolvedValue({ items: [] });
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
    api.list.mockResolvedValue({ items: [] });
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

  it("appends the next page and stops at the end", async () => {
    const nextTask = { ...task, id: "b3d08168-87a6-4b41-b488-96c8375ac2ee", title: "Next task" };
    const cursor = { id: task.id, createdAt: task.createdAt };
    api.list.mockResolvedValue({ items: [nextTask] });
    renderTaskList([task], cursor);
    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    await screen.findByRole("heading", { name: "Next task" });
    expect(screen.getByRole("heading", { name: task.title })).toBeTruthy();
    expect(api.list).toHaveBeenCalledWith({ cursor });
    expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
  });

  it("preserves earlier pages after failure and allows retrying", async () => {
    const nextTask = { ...task, id: "b3d08168-87a6-4b41-b488-96c8375ac2ee", title: "Next task" };
    api.list.mockRejectedValueOnce(new Error("Network error")).mockResolvedValue({ items: [nextTask] });
    renderTaskList([task], { id: task.id, createdAt: task.createdAt });
    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Não foi possível carregar mais");
    expect(screen.getByRole("heading", { name: task.title })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Tentar carregar novamente" }));
    await screen.findByRole("heading", { name: "Next task" });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("loads the next page when the scroll sentinel becomes visible", async () => {
    let intersect: () => void = () => { throw new Error("Observer not initialized"); };
    const disconnect = vi.fn();
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        intersect = () => callback([{ isIntersecting: true }]);
      }
      observe() {}
      disconnect = disconnect;
    });
    api.list.mockResolvedValue({ items: [] });
    renderTaskList([task], { id: task.id, createdAt: task.createdAt });
    await act(async () => { intersect(); });
    await waitFor(() => expect(api.list).toHaveBeenCalledTimes(1));
    expect(disconnect).toHaveBeenCalled();
  });
});
