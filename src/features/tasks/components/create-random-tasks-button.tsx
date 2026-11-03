"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { TaskInput } from "@/features/tasks/schemas/task.schema";
import { useTRPC } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/toast";

function randomTask(): TaskInput {
  const actions = ["Revisar", "Organizar", "Planejar", "Preparar", "Concluir"];
  const subjects = ["documentação", "testes", "entrega", "relatório", "apresentação"];
  return {
    title: `${actions[Math.floor(Math.random() * actions.length)]} ${subjects[Math.floor(Math.random() * subjects.length)]}`,
    description: `Tarefa aleatória de teste ${Math.floor(Math.random() * 10000)}.`,
  };
}

export function CreateRandomTasksButton() {
  const trpc = useTRPC();
  const { showError, showSuccess } = useToast();
  const queryClient = useQueryClient();
  const create = useMutation(trpc.tasks.create.mutationOptions());
  const [isCreating, setIsCreating] = useState(false);

  async function createTasks() {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const results = await Promise.allSettled(
        Array.from({ length: 10 }, () => create.mutateAsync(randomTask())),
      );
      const count = results.filter((result) => result.status === "fulfilled").length;
      if (count === 10) showSuccess("10 tarefas aleatórias criadas.");
      else showError(`${count} de 10 tarefas foram criadas.`);
      if (count > 0) await queryClient.invalidateQueries({ queryKey: trpc.tasks.pathKey() });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div>
      <button type="button" className="secondary" disabled={isCreating} onClick={() => void createTasks()}>
        {isCreating ? "Criando tarefas…" : "Criar 10 tarefas aleatórias"}
      </button>
    </div>
  );
}
