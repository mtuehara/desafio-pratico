import { TaskList } from "@/components/task-list";
import { appRouter } from "@/server/router";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage() {
  const tasks = await appRouter.createCaller({}).tasks.list();
  return (
    <main>
      <h1>Gerenciador de tarefas</h1>
      <p className="intro">Um lugar simples para organizar suas tarefas.</p>
      <TaskList initialTasks={tasks} />
    </main>
  );
}
