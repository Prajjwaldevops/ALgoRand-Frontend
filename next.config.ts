import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile Three.js packages for compatibility
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  // Allow Pinata IPFS gateway images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
      },
    ],
  },
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    NEXT_PUBLIC_ALGO_NETWORK: process.env.NEXT_PUBLIC_ALGO_NETWORK || "testnet",
  },
};

export default nextConfig;
