/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images served from the local gateway (profile pictures etc.)
  images: {
    remotePatterns: [
      // Dev: local gateway
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/uploads/**",
      },
      // Prod: Cloudflare tunnel gateway
      {
        protocol: "https",
        hostname: "api.legalai.bond",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
