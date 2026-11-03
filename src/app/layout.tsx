import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gerenciador de tarefas",
  description: "Gerenciador de tarefas desenvolvido com Next.js e tRPC.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
