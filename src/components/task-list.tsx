"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task } from "@/shared/task";
import { useTRPC } from "@/trpc/client";

const formatDate = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo",
});

export function TaskList({ initialTasks, successMessage }: {
  initialTasks: Task[];
  successMessage?: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const query = useQuery({
    ...trpc.tasks.list.queryOptions(),
    initialData: initialTasks,
  });
  const deleteTask = useMutation(trpc.tasks.delete.mutationOptions({
    onSuccess: async ({ id }) => {
      queryClient.setQueryData(trpc.tasks.list.queryKey(), (tasks) =>
        tasks?.filter((task) => task.id !== id),
      );
      await queryClient.invalidateQueries({ queryKey: trpc.tasks.list.queryKey() });
    },
  }));

  return (
    <section aria-label="Lista de tarefas">
      <div className="toolbar">
        <h2>Suas tarefas</h2>
        <button className="secondary" onClick={() => void query.refetch()} disabled={query.isFetching}>
          {query.isFetching ? "Atualizando…" : "Atualizar lista"}
        </button>
      </div>
      {query.isError && <p role="alert">Não foi possível atualizar as tarefas. Tente novamente.</p>}
      {deleteTask.isError && <p role="alert">{deleteTask.error.message || "Não foi possível excluir a tarefa."}</p>}
      {deleteTask.isSuccess && <p role="status">Tarefa excluída com sucesso.</p>}
      {deleteTask.isIdle && successMessage && <p role="status">{successMessage}</p>}
      {query.data.length === 0 ? (
        <p className="empty">Nenhuma tarefa cadastrada.</p>
      ) : (
        <ul className="task-list">
          {query.data.map((task) => (
            <li key={task.id} className="task-card">
              <h3>{task.title}</h3>
              {task.description && <p className="description">{task.description}</p>}
              <time dateTime={new Date(task.createdAt).toISOString()} title="Horário de Brasília">
                Criada em {formatDate.format(task.createdAt)}
              </time>
              <div className="actions">
                <button
                  className="danger"
                  aria-label={`Excluir ${task.title}`}
                  disabled={deleteTask.isPending}
                  onClick={() => deleteTask.mutate({ id: task.id })}
                >
                  {deleteTask.isPending && deleteTask.variables.id === task.id ? "Excluindo…" : "Excluir"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
