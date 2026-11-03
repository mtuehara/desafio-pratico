import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { appRouter } from "@/server/api/root";
import { AppProviders } from "./providers";
import HomePage from "./page";

vi.mock("server-only", () => ({}));

it("includes tasks in the initial server rendered HTML", async () => {
  const caller = appRouter.createCaller({});
  const task = await caller.tasks.create({ title: "Tarefa carregada no servidor" });
  try {
    const html = renderToStaticMarkup(<AppProviders>{await HomePage()}</AppProviders>);
    expect(html).toContain("Tarefa carregada no servidor</h3>");
  } finally {
    await caller.tasks.delete({ id: task.id });
  }
});
