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
      {
        protocol: 'https',
        hostname: 's3-jaxer.tetrabit.my.id',
      },
    ],
  },
};

export default nextConfig;