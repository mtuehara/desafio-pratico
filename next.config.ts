import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent parent-directory lockfiles from changing the project root.
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
