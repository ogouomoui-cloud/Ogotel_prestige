import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    unoptimized: true, // Local images — no external image optimization service
  },
};

export default nextConfig;
