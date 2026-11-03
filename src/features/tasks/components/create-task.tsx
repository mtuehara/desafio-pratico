"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTRPC } from "@/lib/trpc/client";
import { TaskForm } from "./task-form";
import { useToast } from "@/components/ui/toast";

export function CreateTask() {
  const trpc = useTRPC();
  const { showSuccess } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const create = useMutation(trpc.tasks.create.mutationOptions());

  return (
    <TaskForm submitLabel="Criar tarefa" disabled={isNavigating} onSubmit={async (data) => {
      await create.mutateAsync(data);
      showSuccess("Tarefa criada com sucesso.");
      queryClient.removeQueries({ queryKey: trpc.tasks.pathKey() });
      startTransition(() => { router.push("/"); router.refresh(); });
    }} />
  );
}
