/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Handle @mediapipe/pose and other external dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Ensure @mediapipe/pose can be resolved
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    // Make sure modules are properly resolved
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      'node_modules',
    ];
    
    return config;
  },
};

export default nextConfig;

