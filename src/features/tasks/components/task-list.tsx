"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { TASK_PAGE_SIZE, type TaskPage } from "@/features/tasks/schemas/task.schema";
import { useTRPC } from "@/lib/trpc/client";
import Link from "next/link";

const formatDate = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo",
});

export function TaskList({ initialPage, successMessage }: {
  initialPage: TaskPage;
  successMessage?: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const query = useInfiniteQuery(trpc.tasks.listPage.infiniteQueryOptions(
    { limit: TASK_PAGE_SIZE },
    {
      initialCursor: null,
      initialData: { pages: [initialPage], pageParams: [null] },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  ));
  const tasks = query.data.pages.flatMap((page) => page.items);
  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } = query;

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || isFetching || isFetchNextPageError ||
      !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) void fetchNextPage({ cancelRefetch: false });
    }, { rootMargin: "200px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);

  const deleteTask = useMutation(trpc.tasks.delete.mutationOptions({
    onSuccess: async ({ id }) => {
      queryClient.setQueryData(trpc.tasks.listPage.infiniteQueryKey({ limit: TASK_PAGE_SIZE }), (data) =>
        data ? { ...data, pages: data.pages.map((page) => ({
          ...page, items: page.items.filter((task) => task.id !== id),
        })) } : data,
      );
      await queryClient.invalidateQueries({ queryKey: trpc.tasks.pathKey() });
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
      {query.isError && <p role="alert">{query.isFetchNextPageError
        ? "Não foi possível carregar mais tarefas. Tente novamente."
        : "Não foi possível atualizar as tarefas. Tente novamente."}</p>}
      {deleteTask.isError && <p role="alert">{deleteTask.error.message || "Não foi possível excluir a tarefa."}</p>}
      {deleteTask.isSuccess && <p role="status">Tarefa excluída com sucesso.</p>}
      {deleteTask.isIdle && successMessage && <p role="status">{successMessage}</p>}
      {tasks.length === 0 ? (
        <p className="empty">Nenhuma tarefa cadastrada.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className="task-card">
              <h3>{task.title}</h3>
              {task.description && <p className="description">{task.description}</p>}
              <time dateTime={new Date(task.createdAt).toISOString()} title="Horário de Brasília">
                Criada em {formatDate.format(task.createdAt)}
              </time>
              <div className="actions">
                <Link href={`/tasks/${task.id}/edit`}>Editar</Link>
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
      {hasNextPage && (
        <>
          <div ref={sentinelRef} aria-hidden="true" className="scroll-sentinel" />
          <button className="secondary" disabled={isFetching} onClick={() => void fetchNextPage({ cancelRefetch: false })}>
            {query.isFetchingNextPage ? "Carregando mais…" : isFetchNextPageError ? "Tentar carregar novamente" : "Carregar mais"}
          </button>
        </>
      )}
      {tasks.length > 0 && !hasNextPage && <p className="intro">Todas as tarefas foram carregadas.</p>}
    </section>
  );
}
