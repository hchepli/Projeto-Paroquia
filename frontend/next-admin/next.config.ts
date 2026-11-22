import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// Hosts de imagem separados por vírgula. Ex.: IMAGE_HOSTS=res.cloudinary.com,pub-abc.r2.dev
const imageHosts = (process.env.IMAGE_HOSTS ?? 'res.cloudinary.com')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...imageHosts.map((hostname) => ({ protocol: 'https' as const, hostname })),
      ...(isDev ? [{ protocol: 'https' as const, hostname: 'placeholder.local' }] : []),
    ],
  },
};

export default nextConfig;