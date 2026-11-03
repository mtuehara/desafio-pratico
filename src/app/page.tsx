import { TaskList } from "@/features/tasks/components/task-list";
import { appRouter } from "@/server/api/root";
import Link from "next/link";
import { TASK_PAGE_SIZE } from "@/features/tasks/schemas/task.schema";
import { CreateRandomTasksButton } from "@/features/tasks/components/create-random-tasks-button";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage() {
  const initialPage = await appRouter.createCaller({}).tasks.listPage({ limit: TASK_PAGE_SIZE });
  return (
    <main>
      <h1>Gerenciador de tarefas</h1>
      <p className="intro">Um lugar simples para organizar suas tarefas.</p>
      <div className="actions">
        <Link href="/tasks/new" className="button">Nova tarefa</Link>
        <CreateRandomTasksButton />
      </div>
      <TaskList initialPage={initialPage} />
    </main>
  );
}
