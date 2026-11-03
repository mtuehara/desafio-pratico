// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/toast";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "@/features/tasks/schemas/task.schema";
import { EditTask } from "./edit-task";

const api = vi.hoisted(() => ({ update: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: api.push, refresh: api.refresh }) }));
vi.mock("@/lib/trpc/client", () => ({
  useTRPC: () => ({ tasks: {
    update: { mutationOptions: () => ({ mutationFn: api.update }) },
    pathKey: () => ["tasks"],
  } }),
}));

const task: Task = {
  id: "a3d08168-87a6-4b41-b488-96c8375ac2ee", title: "Study", description: "Review",
  createdAt: Date.parse("2026-11-03T12:00:00Z"),
};

afterEach(cleanup);
beforeEach(() => {
  api.update.mockReset();
  api.update.mockResolvedValue(task);
});

function renderEditTask() {
  const client = new QueryClient();
  client.setQueryData(["tasks"], [task]);
  render(<ToastProvider><QueryClientProvider client={client}><EditTask task={task} /></QueryClientProvider></ToastProvider>);
  return client;
}

describe("task editing", () => {
  it("submits the original ID and edited fields and navigates after success", async () => {
    const client = renderEditTask();
    expect(screen.getByLabelText(/Título/)).toHaveProperty("value", "Study");
    await userEvent.clear(screen.getByLabelText(/Título/));
    await userEvent.type(screen.getByLabelText(/Título/), "Practice");
    await userEvent.clear(screen.getByLabelText(/Descrição/));
    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(api.push).toHaveBeenCalledWith("/"));
    expect(api.update.mock.calls[0][0]).toEqual({ id: task.id, title: "Practice", description: undefined });
    expect(client.getQueryData(["tasks"])).toBeUndefined();
    expect(screen.getByRole("status", { name: "Sucesso" }).textContent).toContain("Tarefa atualizada com sucesso.");
  });

  it("keeps the form when the task was deleted before saving", async () => {
    api.update.mockRejectedValue(new Error("Tarefa não encontrada."));
    renderEditTask();
    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Tarefa não encontrada.");
    expect(screen.getByLabelText(/Título/)).toHaveProperty("value", "Study");
    expect(api.push).not.toHaveBeenCalled();
    expect(screen.queryByRole("status", { name: "Sucesso" })).toBeNull();
  });
});
