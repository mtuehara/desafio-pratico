import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { EditTask } from "@/features/tasks/components/edit-task";
import { appRouter } from "@/server/api/root";
import { taskIdSchema } from "@/features/tasks/schemas/task.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const result = taskIdSchema.safeParse(await params);
  if (!result.success) notFound();

  const task = await appRouter.createCaller({}).tasks.getById(result.data).catch((error: unknown) => {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  });

  return (
    <main>
      <h1>Editar tarefa</h1>
      <p className="intro">Atualize o título ou a descrição da tarefa.</p>
      <EditTask key={task.id} task={task} />
    </main>
  );
}
