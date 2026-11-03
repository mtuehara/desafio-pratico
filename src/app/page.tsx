import { TaskList } from "@/features/tasks/components/task-list";
import { appRouter } from "@/server/api/root";
import Link from "next/link";
import { TASK_PAGE_SIZE } from "@/features/tasks/schemas/task.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage({ searchParams }: {
  searchParams: Promise<{ success?: string | string[] }>;
}) {
  const initialPage = await appRouter.createCaller({}).tasks.listPage({ limit: TASK_PAGE_SIZE });
  const { success } = await searchParams;
  const successMessage = success === "created"
    ? "Tarefa criada com sucesso."
    : success === "updated" ? "Tarefa atualizada com sucesso." : undefined;
  return (
    <main>
      <h1>Gerenciador de tarefas</h1>
      <p className="intro">Um lugar simples para organizar suas tarefas.</p>
      <Link href="/tasks/new" className="button">Nova tarefa</Link>
      <TaskList initialPage={initialPage} successMessage={successMessage} />
    </main>
  );
}
