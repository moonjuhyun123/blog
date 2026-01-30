import type { NextConfig } from "next";

const backendBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "http://localhost:8081";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${backendBase.replace(/\/+$/, "")}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
