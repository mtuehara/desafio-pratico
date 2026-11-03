import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "coverage/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: [
      "src/features/*/components/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/lib/trpc/**/*.{ts,tsx}",
      "src/app/providers.tsx",
    ],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/server/**", "@/features/*/server/**"],
          allowTypeImports: true,
          message: "Client modules may import server types only. Use the typed tRPC client for runtime access.",
        }],
      }],
    },
  },
  {
    files: ["src/features/*/schemas/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/server/**", "@/lib/trpc/**", "@/features/*/server/**", "@/features/*/components/**"],
          message: "Schemas define shared contracts and must not depend on UI, transport or server implementation.",
        }],
      }],
    },
  },
];

export default config;
