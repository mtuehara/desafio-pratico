import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gerenciador de tarefas",
  description: "Gerenciador de tarefas desenvolvido com Next.js e tRPC.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
