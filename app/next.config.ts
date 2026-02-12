import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable instrumentation hook for database initialization on server startup
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
