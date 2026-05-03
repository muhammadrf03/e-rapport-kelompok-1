import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // 🔥 ini bypass error TS
  },
};

export default nextConfig;