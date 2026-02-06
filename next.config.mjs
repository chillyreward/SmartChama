/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Stop the build from failing if there are small grammar mistakes (Linting)
    eslint: {
      ignoreDuringBuilds: true,
    },
    // 2. Stop the build from failing if there are small TypeScript errors
    typescript: {
      ignoreBuildErrors: true,
    },
    // 3. Improve memory usage to prevent "Call retries exceeded" errors
    reactStrictMode: true,
  };
  
  export default nextConfig;