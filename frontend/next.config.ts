import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  experimental: { optimizeCss: true },
  transpilePackages: [],
  poweredByHeader: false,
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;