import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTaskStore } from "./task-store";

describe("task store", () => {
  let store: ReturnType<typeof createTaskStore>;

  beforeEach(() => {
    store = createTaskStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-03T12:00:00Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("keeps store instances independent", () => {
    store.create({ title: "Uma tarefa" });
    expect(createTaskStore().list()).toEqual([]);
  });

  it("generates unique IDs and a server timestamp", () => {
    const first = store.create({ title: "Primeira" });
    const second = store.create({ title: "Segunda" });
    expect(first.id).not.toBe(second.id);
    expect(first.createdAt).toBe(Date.now());
    expect(store.getById(first.id)).toEqual(first);
  });

  it("sorts by descending creation time and breaks ties by ID", () => {
    const older = store.create({ title: "Antiga" });
    vi.advanceTimersByTime(1000);
    const a = store.create({ title: "A" });
    const b = store.create({ title: "B" });
    expect(store.list().map((task) => task.id)).toEqual([
      ...[a.id, b.id].sort((x, y) => x.localeCompare(y)), older.id,
    ]);
  });

  it("updates editable fields and allows clearing the description", () => {
    const original = store.create({ title: "Antiga", description: "Descrição" });
    vi.advanceTimersByTime(1000);
    expect(store.update(original.id, { title: "Nova" })).toEqual({
      ...original, title: "Nova", description: undefined,
    });
  });

  it("does not expose internal references", () => {
    const created = store.create({ title: "Original" });
    created.title = "Alterada na criação";
    store.list()[0].title = "Alterada na listagem";
    const found = store.getById(created.id)!;
    found.title = "Alterada na busca";
    const updated = store.update(created.id, { title: "Atualizada" })!;
    updated.title = "Alterada na edição";
    expect(store.getById(created.id)?.title).toBe("Atualizada");
  });

  it("deletes an existing task", () => {
    const task = store.create({ title: "Excluir" });
    expect(store.delete(task.id)).toBe(true);
    expect(store.getById(task.id)).toBeUndefined();
    expect(store.list()).toEqual([]);
  });

  it("reports missing tasks without creating them during an update", () => {
    expect(store.getById("ausente")).toBeUndefined();
    expect(store.update("ausente", { title: "Nova" })).toBeUndefined();
    expect(store.delete("ausente")).toBe(false);
    expect(store.list()).toEqual([]);
  });
});
