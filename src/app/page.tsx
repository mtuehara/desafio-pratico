import { TaskList } from "@/components/task-list";
import { appRouter } from "@/server/router";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage({ searchParams }: {
  searchParams: Promise<{ success?: string | string[] }>;
}) {
  const tasks = await appRouter.createCaller({}).tasks.list();
  const { success } = await searchParams;
  const successMessage = success === "created"
    ? "Tarefa criada com sucesso."
    : success === "updated" ? "Tarefa atualizada com sucesso." : undefined;
  return (
    <main>
      <h1>Gerenciador de tarefas</h1>
      <p className="intro">Um lugar simples para organizar suas tarefas.</p>
      <Link href="/tasks/new" className="button">Nova tarefa</Link>
      <TaskList initialTasks={tasks} successMessage={successMessage} />
    </main>
  );
}
