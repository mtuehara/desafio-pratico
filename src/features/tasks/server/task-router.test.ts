import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTaskStore } from "./task-store";
import { createTasksRouter } from "./task-router";

vi.mock("server-only", () => ({}));

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

  it("paginates equal timestamps without duplicates or missing tasks", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    for (let index = 0; index < 5; index++) await caller.create({ title: `Task ${index}` });
    const all = await caller.list();
    const first = await caller.listPage({ limit: 2 });
    const second = await caller.listPage({ limit: 2, cursor: first.nextCursor });
    const third = await caller.listPage({ limit: 2, cursor: second.nextCursor });
    expect([...first.items, ...second.items, ...third.items]).toEqual(all);
    expect(third.nextCursor).toBeUndefined();
  });

  it("continues after the cursor task has been deleted", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    for (let index = 0; index < 5; index++) await caller.create({ title: `Task ${index}` });
    const all = await caller.list();
    const first = await caller.listPage({ limit: 2 });
    await caller.delete({ id: first.items[1].id });
    const second = await caller.listPage({ limit: 2, cursor: first.nextCursor });
    expect(second.items).toEqual(all.slice(2, 4));
  });

  it("does not repeat earlier pages when a newer task is inserted", async () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
    for (let index = 0; index < 4; index++) await caller.create({ title: `Task ${index}` });
    const all = await caller.list();
    const first = await caller.listPage({ limit: 2 });
    clock.mockReturnValue(2000);
    await caller.create({ title: "Newer task" });
    const second = await caller.listPage({ limit: 2, cursor: first.nextCursor });
    expect(second.items).toEqual(all.slice(2));
    expect(second.nextCursor).toBeUndefined();
  });

  it("uses the default page size and returns an empty final cursor", async () => {
    for (let index = 0; index < 11; index++) await caller.create({ title: `Task ${index}` });
    const first = await caller.listPage({});
    expect(first.items).toHaveLength(10);
    const last = await caller.listPage({ cursor: first.nextCursor });
    expect(last.items).toHaveLength(1);
    expect(last.nextCursor).toBeUndefined();
  });
});
