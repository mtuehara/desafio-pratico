import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que lockfiles de diretórios superiores alterem a raiz do projeto.
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
