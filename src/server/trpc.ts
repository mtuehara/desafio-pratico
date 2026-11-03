import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";

const t = initTRPC.create({
  errorFormatter({ shape, error }) {
    const message =
      error.code === "INTERNAL_SERVER_ERROR"
        ? "Não foi possível concluir a operação. Tente novamente."
        : error.cause instanceof ZodError
          ? error.cause.issues[0]?.message ?? "Dados inválidos."
          : shape.message;

    return { ...shape, message };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
