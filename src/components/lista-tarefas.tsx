"use client";

import { useQuery } from "@tanstack/react-query";
import type { Tarefa } from "@/shared/tarefa";
import { useTRPC } from "@/trpc/client";

const formatarData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo",
});

export function ListaTarefas({ tarefasIniciais }: { tarefasIniciais: Tarefa[] }) {
  const trpc = useTRPC();
  const query = useQuery({
    ...trpc.tarefas.listar.queryOptions(),
    initialData: tarefasIniciais,
  });

  return (
    <section aria-label="Lista de tarefas">
      <div className="toolbar">
        <h2>Suas tarefas</h2>
        <button className="secondary" onClick={() => void query.refetch()} disabled={query.isFetching}>
          {query.isFetching ? "Atualizando…" : "Atualizar lista"}
        </button>
      </div>
      {query.isError && <p role="alert">Não foi possível atualizar as tarefas. Tente novamente.</p>}
      {query.data.length === 0 ? (
        <p className="empty">Nenhuma tarefa cadastrada.</p>
      ) : (
        <ul className="task-list">
          {query.data.map((tarefa) => (
            <li key={tarefa.id} className="task-card">
              <h3>{tarefa.titulo}</h3>
              {tarefa.descricao && <p className="description">{tarefa.descricao}</p>}
              <time dateTime={new Date(tarefa.dataCriacao).toISOString()} title="Horário de Brasília">
                Criada em {formatarData.format(tarefa.dataCriacao)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
