import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { appRouter } from "@/server/router";
import { Providers } from "@/trpc/client";
import HomePage from "./page";

vi.mock("server-only", () => ({}));

it("inclui as tarefas no HTML inicial renderizado no servidor", async () => {
  const caller = appRouter.createCaller({});
  const tarefa = await caller.tarefas.criar({ titulo: "Tarefa carregada no servidor" });
  try {
    const html = renderToStaticMarkup(<Providers>{await HomePage()}</Providers>);
    expect(html).toContain("Tarefa carregada no servidor</h3>");
  } finally {
    await caller.tarefas.deletar({ id: tarefa.id });
  }
});
