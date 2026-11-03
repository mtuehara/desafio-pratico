"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Task } from "@/features/tasks/schemas/task.schema";
import { useTRPC } from "@/lib/trpc/client";
import { TaskForm } from "./task-form";
import { useToast } from "@/components/ui/toast";

export function EditTask({ task }: { task: Task }) {
  const trpc = useTRPC();
  const { showSuccess } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const updateTask = useMutation(trpc.tasks.update.mutationOptions());

  return (
    <TaskForm initialValues={task} submitLabel="Salvar alterações" disabled={isNavigating} onSubmit={async (data) => {
      await updateTask.mutateAsync({ id: task.id, ...data });
      showSuccess("Tarefa atualizada com sucesso.");
      queryClient.removeQueries({ queryKey: trpc.tasks.pathKey() });
      startTransition(() => { router.push("/"); router.refresh(); });
    }} />
  );
}
