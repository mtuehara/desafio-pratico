"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import { useState, type ReactNode } from "react";
import { TRPCProvider } from "@/lib/trpc/client";
import type { AppRouter } from "@/server/api/root";
import { ToastProvider, useToast } from "@/components/ui/toast";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ToastProvider><TRPCQueryProvider>{children}</TRPCQueryProvider></ToastProvider>;
}

function TRPCQueryProvider({ children }: { children: ReactNode }) {
  const { showError } = useToast();
  function notifyError(error: Error) {
    showError(error instanceof TRPCClientError && !error.data
      ? "Não foi possível conectar ao servidor. Tente novamente."
      : error.message || "Não foi possível concluir a operação. Tente novamente.");
  }

  const [queryClient] = useState(
    () => new QueryClient({
      queryCache: new QueryCache({ onError: notifyError }),
      mutationCache: new MutationCache({ onError: notifyError }),
      defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
    }),
  );
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: "/api/trpc" })] }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
