import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phones and tablets on this local Wi-Fi network to load the dev
  // client/HMR resources. Without this, the HTML renders but React controls
  // such as Join and More never become interactive on the device.
  allowedDevOrigins: ["192.168.0.138", "127.0.0.1", "localhost"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
