"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ToastVariant = "success" | "error";
const ToastContext = createContext<{
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const showError = useCallback((message: string) => setToast({ message, variant: "error" }), []);
  const showSuccess = useCallback((message: string) => setToast({ message, variant: "success" }), []);
  const context = useMemo(() => ({ showError, showSuccess }), [showError, showSuccess]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);

  return (
    <ToastContext.Provider value={context}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.variant}`} role={toast.variant === "error" ? "alert" : "status"}
          aria-label={toast.variant === "error" ? "Erro" : "Sucesso"} aria-atomic="true">
          <p>{toast.message}</p>
          <button type="button" onClick={() => setToast(null)} aria-label="Fechar notificação">Fechar</button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider.");
  return context;
}
