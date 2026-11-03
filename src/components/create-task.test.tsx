// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateTask } from "./create-task";

const api = vi.hoisted(() => ({ create: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: api.push, refresh: api.refresh }) }));
vi.mock("@/trpc/client", () => ({
  useTRPC: () => ({ tasks: {
    create: { mutationOptions: () => ({ mutationFn: api.create }) },
    pathKey: () => ["tasks"],
  } }),
}));

afterEach(cleanup);
beforeEach(() => {
  api.create.mockReset();
  api.create.mockResolvedValue({ id: "nova" });
});

function renderCreateTask() {
  const client = new QueryClient();
  client.setQueryData(["tasks"], []);
  render(<QueryClientProvider client={client}><CreateTask /></QueryClientProvider>);
  return client;
}

describe("task creation", () => {
  it("creates a task, removes stale cache and navigates after success", async () => {
    const client = renderCreateTask();
    await userEvent.type(screen.getByLabelText(/Título/), "Estudar");
    await userEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));
    await waitFor(() => expect(api.push).toHaveBeenCalledWith("/?success=created"));
    expect(api.create.mock.calls[0][0]).toEqual({ title: "Estudar", description: undefined });
    expect(client.getQueryData(["tasks"])).toBeUndefined();
    expect(api.refresh).toHaveBeenCalled();
  });

  it("stays on the form when the API fails", async () => {
    api.create.mockRejectedValue(new Error("Falha ao criar tarefa."));
    renderCreateTask();
    await userEvent.type(screen.getByLabelText(/Título/), "Estudar");
    await userEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Falha ao criar tarefa.");
    expect(api.push).not.toHaveBeenCalled();
  });
});
