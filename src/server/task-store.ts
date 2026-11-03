import { randomUUID } from "node:crypto";
import type { Task, TaskInput } from "@/shared/task";

export function createTaskStore() {
  const tasks = new Map<string, Task>();

  return {
    list(): Task[] {
      return Array.from(tasks.values(), (task) => ({ ...task })).sort(
        (a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id),
      );
    },
    getById(id: string): Task | undefined {
      const task = tasks.get(id);
      return task ? { ...task } : undefined;
    },
    create(input: TaskInput): Task {
      const task: Task = {
        id: randomUUID(),
        title: input.title,
        description: input.description,
        createdAt: Date.now(),
      };
      tasks.set(task.id, task);
      return { ...task };
    },
    update(id: string, input: TaskInput): Task | undefined {
      const current = tasks.get(id);
      if (!current) return undefined;

      const task = { ...current, title: input.title, description: input.description };
      tasks.set(id, task);
      return { ...task };
    },
    delete(id: string): boolean {
      return tasks.delete(id);
    },
  };
}

export type TaskStore = ReturnType<typeof createTaskStore>;

// SSR pages and the API share one process-local instance, including after module reloads.
const taskGlobal = globalThis as typeof globalThis & { taskStore?: TaskStore };
export const taskStore = taskGlobal.taskStore ??= createTaskStore();
