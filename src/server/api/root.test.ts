import { createTRPCClient, httpLink } from "@trpc/client";
import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/trpc/[trpc]/route";
import { appRouter, type AppRouter } from "./root";

vi.mock("server-only", () => ({}));

describe("tRPC integration", () => {
  it("supports direct server calls", async () => {
    await expect(appRouter.createCaller({}).status()).resolves.toEqual({ ok: true });
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

    await expect(client.status.query()).resolves.toEqual({ ok: true });
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
});
