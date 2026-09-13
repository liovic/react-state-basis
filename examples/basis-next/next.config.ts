import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    swcPlugins: [['react-state-basis/swc', {}]],
  },
};

export default nextConfig;
