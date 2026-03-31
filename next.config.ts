import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "103.31.204.110",
        port: "1608",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
