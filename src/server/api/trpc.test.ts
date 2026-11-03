import { createTRPCClient, httpLink } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { describe, expect, it } from "vitest";
import { createTRPCRouter, publicProcedure } from "./trpc";

describe("tRPC error contract", () => {
  it.each([
    { code: "BAD_REQUEST", httpStatus: 400 },
    { code: "NOT_FOUND", httpStatus: 404 },
    { code: "CONFLICT", httpStatus: 409 },
    { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 },
  ] as const)("preserves $code and HTTP $httpStatus through the transport", async ({ code, httpStatus }) => {
    const message = "Falha de teste.";
    const testRouter = createTRPCRouter({
      fail: publicProcedure.mutation(() => { throw new TRPCError({ code, message }); }),
    });
    const client = createTRPCClient<typeof testRouter>({ links: [httpLink({
      url: "http://localhost/api/trpc",
      fetch: (input, init) => fetchRequestHandler({
        endpoint: "/api/trpc", req: new Request(input, init), router: testRouter,
        createContext: () => ({}),
      }),
    })] });

    await expect(client.fail.mutate()).rejects.toMatchObject({
      message: code === "INTERNAL_SERVER_ERROR"
        ? "Não foi possível concluir a operação. Tente novamente."
        : message,
      data: { code, httpStatus },
    });
  });
});
