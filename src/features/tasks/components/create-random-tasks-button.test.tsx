// @vitest-environment jsdom
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { taskInputSchema, type Task } from "@/features/tasks/schemas/task.schema";
import { CreateRandomTasksButton } from "./create-random-tasks-button";

const api = vi.hoisted(() => ({ create: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/trpc/client", () => ({
  useTRPC: () => ({ tasks: {
    create: { mutationOptions: () => ({ mutationFn: api.create }) },
    pathKey: () => ["tasks"],
  } }),
}));

const task: Task = { id: "test-task", title: "Test task", createdAt: 1 };
function tasks(count: number): Task[] {
  return Array.from({ length: count }, (_, index) => ({ ...task, id: `test-${index}` }));
}

function ListedTaskCount() {
  const query = useQuery<Task[]>({ queryKey: ["tasks"], queryFn: api.list, initialData: [] });
  return <p>{query.data.length} tasks listed</p>;
}

function renderButton() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  render(<QueryClientProvider client={client}><CreateRandomTasksButton /><ListedTaskCount /></QueryClientProvider>);
}

afterEach(cleanup);
beforeEach(() => {
  api.create.mockReset();
  api.create.mockResolvedValue(task);
  api.list.mockReset();
  api.list.mockResolvedValue(tasks(10));
});

describe("random task creation button", () => {
  it("creates ten valid tasks per click and updates the list", async () => {
    api.list.mockResolvedValueOnce(tasks(10)).mockResolvedValueOnce(tasks(20));
    renderButton();
    const button = screen.getByRole("button", { name: "Criar 10 tarefas aleatórias" });
    await userEvent.click(button);
    await screen.findByText("10 tasks listed");
    expect(api.create).toHaveBeenCalledTimes(10);
    expect(screen.getByRole("status").textContent).toBe("10 tarefas aleatórias criadas.");
    await waitFor(() => expect(button).toHaveProperty("disabled", false));
    await userEvent.click(button);
    await screen.findByText("20 tasks listed");
    expect(api.create).toHaveBeenCalledTimes(20);
    for (const [input] of api.create.mock.calls) {
      expect(taskInputSchema.safeParse(input).success).toBe(true);
    }
  });

  it("prevents another batch while creation is pending", async () => {
    const operation = Promise.withResolvers<Task>();
    api.create.mockReturnValue(operation.promise);
    renderButton();
    const button = screen.getByRole("button", { name: "Criar 10 tarefas aleatórias" });
    await userEvent.click(button);
    expect(button).toHaveProperty("disabled", true);
    expect(button.textContent).toBe("Criando tarefas…");
    await userEvent.click(button);
    expect(api.create).toHaveBeenCalledTimes(10);
    await act(async () => { operation.resolve(task); });
    await screen.findByText("10 tasks listed");
    await waitFor(() => expect(button).toHaveProperty("disabled", false));
  });

  it("reports partial failure and still loads the tasks that were created", async () => {
    api.create.mockRejectedValueOnce(new Error("Request failed"));
    api.list.mockResolvedValue(tasks(9));
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: "Criar 10 tarefas aleatórias" }));
    await screen.findByText("9 tasks listed");
    expect(screen.getByRole("alert").textContent).toBe("9 de 10 tarefas foram criadas.");
    expect(api.create).toHaveBeenCalledTimes(10);
  });

  it("reports complete failure without reloading an unchanged list", async () => {
    api.create.mockRejectedValue(new Error("Request failed"));
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: "Criar 10 tarefas aleatórias" }));
    expect((await screen.findByRole("alert")).textContent).toBe("0 de 10 tarefas foram criadas.");
    expect(api.list).not.toHaveBeenCalled();
    expect(screen.getByText("0 tasks listed")).toBeTruthy();
  });
});
