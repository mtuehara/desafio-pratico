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
