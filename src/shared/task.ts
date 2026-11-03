import { z } from "zod";

export const taskInputSchema = z.object({
  title: z.string({ error: "Informe o título da tarefa." }).trim().min(1, "Informe o título da tarefa."),
  description: z.string().trim().transform((value) => value || undefined).optional(),
});

export const taskIdSchema = z.object({
  id: z.uuid({ error: "Identificador de tarefa inválido." }),
});

export const updateTaskSchema = taskInputSchema.extend(taskIdSchema.shape);

export type TaskInput = z.infer<typeof taskInputSchema>;

export type Task = TaskInput & {
  id: string;
  createdAt: number;
};

export const TASK_PAGE_SIZE = 10;

const taskCursorSchema = z.object({
  createdAt: z.number().int().nonnegative(),
  id: z.uuid(),
});

export const taskPageInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(TASK_PAGE_SIZE),
  cursor: taskCursorSchema.optional(),
});

export type TaskCursor = z.infer<typeof taskCursorSchema>;
export type TaskPage = { items: Task[]; nextCursor?: TaskCursor };
