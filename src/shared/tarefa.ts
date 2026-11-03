import { z } from "zod";

export const tarefaInputSchema = z.object({
  titulo: z.string({ error: "Informe o título da tarefa." }).trim().min(1, "Informe o título da tarefa."),
  descricao: z.string().trim().transform((value) => value || undefined).optional(),
});

export const tarefaIdSchema = z.object({
  id: z.uuid({ error: "Identificador de tarefa inválido." }),
});

export const atualizarTarefaSchema = tarefaInputSchema.extend(tarefaIdSchema.shape);

export type TarefaInput = z.infer<typeof tarefaInputSchema>;

export type Tarefa = TarefaInput & {
  id: string;
  dataCriacao: number;
};
