/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  
  env: {
    NEXT_PUBLIC_DEV_OVERLAY: 'false',
  },
  
  poweredByHeader: false,
  
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.plugins = config.plugins.filter(plugin => 
        plugin.constructor.name !== 'ReactRefreshWebpackPlugin'
      )
    }
    return config
  },
}
export default nextConfig
