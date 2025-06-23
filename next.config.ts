import type { NextConfig } from "next"
import { codeInspectorPlugin } from "code-inspector-plugin"

const nextConfig: NextConfig = {
  webpack: (config) => {
    if (process.env.NODE_ENV === 'development') {
      config.plugins.push(codeInspectorPlugin({ bundler: "webpack" }))
    }
    return config
  },
  images: {
    domains: ['app.nemoprotocol.com'],
  },
}

export default nextConfig
