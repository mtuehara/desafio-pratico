// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskForm } from "./task-form";

afterEach(cleanup);

describe("task form", () => {
  it.each(["", "   "])("prevents submitting an empty title: %s", async (title) => {
    const save = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm submitLabel="Criar tarefa" onSubmit={save} />);
    if (title) await userEvent.type(screen.getByLabelText(/Título/), title);
    await userEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));
    expect(screen.getByRole("alert").textContent).toBe("Informe o título da tarefa.");
    expect(screen.getByLabelText(/Título/).getAttribute("aria-invalid")).toBe("true");
    expect(save).not.toHaveBeenCalled();
  });

  it("submits normalized text fields", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm submitLabel="Criar tarefa" onSubmit={save} />);
    await userEvent.type(screen.getByLabelText(/Título/), "  Estudar  ");
    await userEvent.type(screen.getByLabelText(/Descrição/), "  tRPC  ");
    await userEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));
    expect(save).toHaveBeenCalledWith({ title: "Estudar", description: "tRPC" });
  });

  it("allows submitting without a description", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm submitLabel="Criar tarefa" onSubmit={save} />);
    await userEvent.type(screen.getByLabelText(/Título/), "Estudar");
    await userEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));
    expect(save.mock.calls[0][0].description).toBeUndefined();
  });

  it("populates fields with initial values", () => {
    render(<TaskForm submitLabel="Salvar" initialValues={{ title: "Revisar", description: "Next.js" }} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/Título/)).toHaveProperty("value", "Revisar");
    expect(screen.getByLabelText(/Descrição/)).toHaveProperty("value", "Next.js");
  });

  it("preserves input and allows retrying after an error", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("Tarefa não encontrada.")).mockResolvedValue(undefined);
    render(<TaskForm submitLabel="Salvar" initialValues={{ title: "Revisar" }} onSubmit={save} />);
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Tarefa não encontrada.");
    expect(screen.getByLabelText(/Título/)).toHaveProperty("value", "Revisar");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(save).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("disables fields and prevents duplicate submissions while saving", async () => {
    const operation = Promise.withResolvers<void>();
    const save = vi.fn(() => operation.promise);
    render(<TaskForm submitLabel="Salvar" initialValues={{ title: "Revisar" }} onSubmit={save} />);
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    const button = screen.getByRole("button", { name: "Salvando…" });
    expect(button).toHaveProperty("disabled", true);
    expect(screen.getByLabelText(/Título/)).toHaveProperty("disabled", true);
    await userEvent.click(button);
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => { operation.resolve(); });
    expect(screen.getByRole("button", { name: "Salvar" })).toHaveProperty("disabled", false);
  });
});
