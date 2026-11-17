import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Se o STORAGE_PROVIDER for 'r2', adicione o host do R2_PUBLIC_URL aqui.
      ...(isDev ? [{ protocol: 'https' as const, hostname: 'placeholder.local' }] : []),
    ],
  },
};

export default nextConfig;