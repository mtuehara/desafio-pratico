import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { appRouter } from "@/server/api/root";
import type { Task } from "@/features/tasks/schemas/task.schema";
import EditTaskPage from "./page";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/features/tasks/components/edit-task", () => ({
  EditTask: ({ task }: { task: Task }) => <div>{task.title}</div>,
}));

describe("edit page server loading", () => {
  it("loads the existing task before rendering the form", async () => {
    const caller = appRouter.createCaller({});
    const task = await caller.tasks.create({ title: "Existing task" });
    try {
      const page = await EditTaskPage({ params: Promise.resolve({ id: task.id }) });
      expect(renderToStaticMarkup(page)).toContain("Existing task");
    } finally {
      await caller.tasks.delete({ id: task.id });
    }
  });

  it("returns not found for a malformed ID", async () => {
    await expect(EditTaskPage({ params: Promise.resolve({ id: "invalid-id" }) })).rejects.toThrow("NOT_FOUND");
  });

  it("returns not found for a missing task", async () => {
    await expect(EditTaskPage({ params: Promise.resolve({ id: "a3d08168-87a6-4b41-b488-96c8375ac2ee" }) })).rejects.toThrow("NOT_FOUND");
  });
});
