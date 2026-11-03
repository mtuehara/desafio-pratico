// @vitest-environment jsdom
import { useQueryClient } from "@tanstack/react-query";
import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/trpc/[trpc]/route";
import { CreateTask } from "@/features/tasks/components/create-task";
import { EditTask } from "@/features/tasks/components/edit-task";
import { TaskList } from "@/features/tasks/components/task-list";
import { useTRPC } from "@/lib/trpc/client";
import { appRouter } from "@/server/api/root";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { taskInputSchema, updateTaskSchema } from "@/features/tasks/schemas/task.schema";
import { AppProviders } from "./providers";

const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    GET(new Request(new URL(input instanceof Request ? input.url : String(input), "http://localhost"), init)),
  ));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function respondWithConflict() {
  const fail = () => { throw new TRPCError({ code: "CONFLICT", message: "Conflito ao salvar a tarefa." }); };
  const testRouter = createTRPCRouter({ tasks: createTRPCRouter({
    create: publicProcedure.input(taskInputSchema).mutation(fail),
    update: publicProcedure.input(updateTaskSchema).mutation(fail),
  }) });
  vi.mocked(globalThis.fetch).mockImplementation((input, init) => fetchRequestHandler({
    endpoint: "/api/trpc", router: testRouter, createContext: () => ({}),
    req: new Request(new URL(input instanceof Request ? input.url : String(input), "http://localhost"), init),
  }));
}

function QueryFailureTrigger() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return <button onClick={() => {
    void queryClient.fetchQuery({ ...trpc.tasks.list.queryOptions(), retry: false }).catch(() => undefined);
  }}>Load tasks</button>;
}

describe("tRPC error toasts", () => {
  it("shows a future conflict response without requiring unique task titles", async () => {
    respondWithConflict();
    render(<AppProviders><CreateTask /></AppProviders>);
    await userEvent.type(screen.getByLabelText(/Título/), "Test task");
    await userEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));
    const toast = await screen.findByRole("alert", { name: "Erro" });
    expect(toast.textContent).toContain("Conflito ao salvar a tarefa.");
    expect(screen.getByLabelText(/Título/)).toHaveProperty("value", "Test task");
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("preserves edit input when a future conflict response is returned", async () => {
    const caller = appRouter.createCaller({});
    const second = await caller.tasks.create({ title: "Second toast task" });
    try {
      respondWithConflict();
      render(<AppProviders><EditTask task={second} /></AppProviders>);
      await userEvent.clear(screen.getByLabelText(/Título/));
      await userEvent.type(screen.getByLabelText(/Título/), "Updated task");
      await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
      const toast = await screen.findByRole("alert", { name: "Erro" });
      expect(toast.textContent).toContain("Conflito ao salvar a tarefa.");
      expect(screen.getByLabelText(/Título/)).toHaveProperty("value", "Updated task");
      expect(await caller.tasks.getById({ id: second.id })).toEqual(second);
      expect(navigation.push).not.toHaveBeenCalled();
    } finally {
      await caller.tasks.delete({ id: second.id });
    }
  });

  it("shows the backend error toast when deleting a missing task", async () => {
    const caller = appRouter.createCaller({});
    const task = await caller.tasks.create({ title: "Deleted toast task" });
    await caller.tasks.delete({ id: task.id });
    render(<AppProviders><TaskList initialPage={{ items: [task] }} /></AppProviders>);
    await userEvent.click(screen.getByRole("button", { name: `Excluir ${task.title}` }));
    const toast = await screen.findByRole("alert", { name: "Erro" });
    expect(toast.textContent).toContain("Tarefa não encontrada.");
    expect(screen.getByRole("heading", { name: task.title })).toBeTruthy();
  });

  it("shows a connection error toast when a tRPC query fails", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error("Network failure"));
    render(<AppProviders><QueryFailureTrigger /></AppProviders>);
    fireEvent.click(screen.getByRole("button", { name: "Load tasks" }));
    const toast = await screen.findByRole("alert", { name: "Erro" });
    expect(toast.textContent).toContain("Não foi possível conectar ao servidor. Tente novamente.");
  });
});
