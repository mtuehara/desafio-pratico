"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTRPC } from "@/trpc/client";
import { TaskForm } from "./task-form";

export function CreateTask() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const create = useMutation(trpc.tasks.create.mutationOptions());

  return (
    <TaskForm submitLabel="Criar tarefa" disabled={isNavigating} onSubmit={async (data) => {
      await create.mutateAsync(data);
      queryClient.removeQueries({ queryKey: trpc.tasks.list.queryKey() });
      startTransition(() => { router.push("/?success=created"); router.refresh(); });
    }} />
  );
}
