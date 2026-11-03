import { createTRPCClient, httpLink } from "@trpc/client";
import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/trpc/[trpc]/route";
import { appRouter, type AppRouter } from "./root";

vi.mock("server-only", () => ({}));

describe("tRPC integration", () => {
  it("supports direct server calls", async () => {
    await expect(appRouter.createCaller({}).tasks.list()).resolves.toEqual([]);
  });

  it("connects the typed client to the HTTP adapter", async () => {
    const client = createTRPCClient<AppRouter>({
      links: [
        httpLink({
          url: "http://localhost/api/trpc",
          fetch: (input, init) => GET(new Request(input, init)),
        }),
      ],
    });

    await expect(client.tasks.list.query()).resolves.toEqual([]);
  });

  it("returns 404 for an unknown procedure", async () => {
    const response = await GET(new Request("http://localhost/api/trpc/inexistente"));
    expect(response.status).toBe(404);
  });

  it("delivers a readable validation error to the HTTP client", async () => {
    const client = createTRPCClient<AppRouter>({
      links: [httpLink({
        url: "http://localhost/api/trpc",
        fetch: (input, init) => GET(new Request(input, init)),
      })],
    });
    await expect(client.tasks.create.mutate({ title: "   " })).rejects.toMatchObject({
      message: "Informe o título da tarefa.", data: { code: "BAD_REQUEST" },
    });
  });

  it("returns a readable conflict when creating a duplicate title over HTTP", async () => {
    const caller = appRouter.createCaller({});
    const task = await caller.tasks.create({ title: "HTTP duplicate create" });
    const client = createTRPCClient<AppRouter>({ links: [httpLink({
      url: "http://localhost/api/trpc", fetch: (input, init) => GET(new Request(input, init)),
    })] });
    try {
      await expect(client.tasks.create.mutate({ title: "http duplicate create" })).rejects.toMatchObject({
        message: "Já existe uma tarefa com esse título.", data: { code: "CONFLICT", httpStatus: 409 },
      });
    } finally {
      await caller.tasks.delete({ id: task.id });
    }
  });

  it("returns a readable conflict when editing to another task's title over HTTP", async () => {
    const caller = appRouter.createCaller({});
    const first = await caller.tasks.create({ title: "HTTP first task" });
    const second = await caller.tasks.create({ title: "HTTP second task" });
    const client = createTRPCClient<AppRouter>({ links: [httpLink({
      url: "http://localhost/api/trpc", fetch: (input, init) => GET(new Request(input, init)),
    })] });
    try {
      await expect(client.tasks.update.mutate({ id: second.id, title: first.title })).rejects.toMatchObject({
        message: "Já existe uma tarefa com esse título.", data: { code: "CONFLICT", httpStatus: 409 },
      });
      expect(await caller.tasks.getById({ id: second.id })).toEqual(second);
    } finally {
      await caller.tasks.delete({ id: first.id });
      await caller.tasks.delete({ id: second.id });
    }
  });
});
