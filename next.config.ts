import type { NextConfig } from "next";

const appEnv = process.env.APP_ENV;
const isLocalDev = process.env.NODE_ENV !== "production";
const isStaging = appEnv === "staging";

const csp = isLocalDev
  ? "default-src 'self'; img-src 'self' data: blob: http://103.31.204.110:1608 https://s3-jaxer.tetrabit.my.id; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; font-src 'self' data:; connect-src 'self' ws: http: https:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  : isStaging
    ? "default-src 'self'; img-src 'self' data: blob: http://103.31.204.110:1608 https://s3-jaxer.tetrabit.my.id; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:; connect-src 'self' http://103.31.204.110:4005 http://103.31.204.110:4003; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    : "default-src 'self'; img-src 'self' data: blob: http://103.31.204.110:1608 https://s3-jaxer.tetrabit.my.id; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: csp
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(), geolocation=(self), payment=(), usb=(), browsing-topics=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
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
