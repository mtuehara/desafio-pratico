"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const ToastContext = createContext<{ showError: (message: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const showError = useCallback((message: string) => setToast({ message }), []);
  const context = useMemo(() => ({ showError }), [showError]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);

  return (
    <ToastContext.Provider value={context}>
      {children}
      {toast && (
        <div className="toast" role="alert" aria-label="Erro" aria-atomic="true">
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
