import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "minimax-algeng-chat-tts-us.oss-us-east-1.aliyuncs.com",
      },
    ],
  },
};

export default nextConfig;
