import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides the Next.js dev-mode indicator (the floating "N" badge) — it only
  // ever appears in local development, never in a production build, but it
  // was showing up during testing and the user wants it gone entirely.
  devIndicators: false,
};

export default nextConfig;
