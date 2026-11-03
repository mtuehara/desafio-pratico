// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "./toast";

function ErrorTrigger() {
  const { showError } = useToast();
  return <button onClick={() => showError("Já existe uma tarefa com esse título.")}>Trigger error</button>;
}

function renderToast() {
  render(<ToastProvider><ErrorTrigger /></ToastProvider>);
}

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("error toast", () => {
  it("shows the error message as an accessible alert", () => {
    renderToast();
    fireEvent.click(screen.getByRole("button", { name: "Trigger error" }));
    expect(screen.getByRole("alert", { name: "Erro" }).textContent).toContain("Já existe uma tarefa com esse título.");
  });

  it("allows dismissing the error", () => {
    renderToast();
    fireEvent.click(screen.getByRole("button", { name: "Trigger error" }));
    fireEvent.click(screen.getByRole("button", { name: "Fechar notificação" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("dismisses the error after five seconds", () => {
    vi.useFakeTimers();
    renderToast();
    fireEvent.click(screen.getByRole("button", { name: "Trigger error" }));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("restarts the display duration when the same error occurs again", () => {
    vi.useFakeTimers();
    renderToast();
    fireEvent.click(screen.getByRole("button", { name: "Trigger error" }));
    act(() => { vi.advanceTimersByTime(4000); });
    fireEvent.click(screen.getByRole("button", { name: "Trigger error" }));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByRole("alert", { name: "Erro" })).toBeTruthy();
    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
