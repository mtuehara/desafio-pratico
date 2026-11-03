"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { taskInputSchema, type TaskInput } from "@/features/tasks/schemas/task.schema";

type Props = {
  initialValues?: TaskInput;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (data: TaskInput) => Promise<void>;
};

export function TaskForm({ initialValues, submitLabel, disabled = false, onSubmit }: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasTitleError, setHasTitleError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isSubmitting || disabled;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;
    setErrorMessage(null);
    setHasTitleError(false);

    const result = taskInputSchema.safeParse({ title, description });
    if (!result.success) {
      setErrorMessage(result.error.issues[0].message);
      setHasTitleError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(result.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível salvar a tarefa. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="task-form" aria-busy={isBusy}>
      <div className="field">
        <label htmlFor="title">Título (obrigatório)</label>
        <input
          id="title" name="title" required value={title}
          onChange={(event) => { setTitle(event.target.value); setHasTitleError(false); }}
          disabled={isBusy} aria-invalid={hasTitleError}
          aria-describedby={hasTitleError ? "form-error" : undefined}
        />
      </div>
      <div className="field">
        <label htmlFor="description">Descrição (opcional)</label>
        <textarea
          id="description" name="description" rows={5} value={description}
          onChange={(event) => setDescription(event.target.value)} disabled={isBusy}
        />
      </div>
      {errorMessage && <p id="form-error" role="alert">{errorMessage}</p>}
      <div className="actions">
        <button type="submit" disabled={isBusy}>{isBusy ? "Salvando…" : submitLabel}</button>
        <Link href="/" aria-disabled={isBusy} onClick={(event) => { if (isBusy) event.preventDefault(); }}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
