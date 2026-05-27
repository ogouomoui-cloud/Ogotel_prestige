import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    unoptimized: true, // Local images — no external image optimization service
  },
  allowedDevOrigins: [
    "space-z.ai",
  ],
};

export default nextConfig;
