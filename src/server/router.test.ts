import { createTRPCClient, httpLink } from "@trpc/client";
import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/trpc/[trpc]/route";
import { appRouter, type AppRouter } from "./router";

vi.mock("server-only", () => ({}));

describe("integração tRPC", () => {
  it("permite chamar o router diretamente no servidor", async () => {
    await expect(appRouter.createCaller({}).status()).resolves.toEqual({ ok: true });
  });

  it("conecta o cliente tipado ao adaptador HTTP", async () => {
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

  it("retorna 404 para uma procedure inexistente", async () => {
    const response = await GET(new Request("http://localhost/api/trpc/inexistente"));
    expect(response.status).toBe(404);
  });

  it("entrega a mensagem de validação ao cliente HTTP", async () => {
    const client = createTRPCClient<AppRouter>({
      links: [httpLink({
        url: "http://localhost/api/trpc",
        fetch: (input, init) => GET(new Request(input, init)),
      })],
    });
    await expect(client.tarefas.criar.mutate({ titulo: "   " })).rejects.toMatchObject({
      message: "Informe o título da tarefa.", data: { code: "BAD_REQUEST" },
    });
  });
});
