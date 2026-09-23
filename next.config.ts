import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product thumbnails/galleries live on cdn.dummyjson.com and user avatars on
    // dummyjson.com. next/image refuses to optimise unknown remote hosts, so we
    // whitelist exactly these two.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.dummyjson.com" },
      { protocol: "https", hostname: "dummyjson.com" },
    ],
  },
};

export default nextConfig;
