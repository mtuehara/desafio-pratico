import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { createTaskStore } from "../task-store";
import { createTasksRouter } from "./tasks";

describe("task procedures", () => {
  let caller: ReturnType<ReturnType<typeof createTasksRouter>["createCaller"]>;

  beforeEach(() => {
    caller = createTasksRouter(createTaskStore()).createCaller({});
  });

  it("creates, lists, finds, updates and deletes a task", async () => {
    expect(await caller.list()).toEqual([]);
    const created = await caller.create({ title: "  Estudar  ", description: "  Next.js  " });
    expect(created).toMatchObject({ title: "Estudar", description: "Next.js" });
    expect(await caller.list()).toEqual([created]);
    expect(await caller.getById({ id: created.id })).toEqual(created);

    expect(await caller.update({ id: created.id, title: "Revisar" })).toEqual({
      ...created, title: "Revisar", description: undefined,
    });
    expect(await caller.delete({ id: created.id })).toEqual({ id: created.id });
    expect(await caller.list()).toEqual([]);
  });

  it("rejects an empty title without changing the list", async () => {
    await expect(caller.create({ title: "   " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await caller.list()).toEqual([]);
  });

  it("preserves the task when an update is invalid", async () => {
    const task = await caller.create({ title: "Original" });
    await expect(caller.update({ id: task.id, title: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await caller.getById({ id: task.id })).toEqual(task);
  });

  it("rejects a malformed ID", async () => {
    await expect(caller.getById({ id: "errado" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns NOT_FOUND when reading a missing task", async () => {
    await expect(caller.getById({ id: randomUUID() })).rejects.toMatchObject({
      code: "NOT_FOUND", message: "Tarefa não encontrada.",
    });
  });

  it("returns NOT_FOUND when updating a missing task", async () => {
    await expect(caller.update({ id: randomUUID(), title: "Nova" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns NOT_FOUND when deleting a missing task", async () => {
    await expect(caller.delete({ id: randomUUID() })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
