import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const imageHosts = (process.env.IMAGE_HOSTS ?? 'res.cloudinary.com')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

// Report-only: só registra violações, não bloqueia nada. Em dev fica desligada.
// 'unsafe-inline' porque o Next injeta scripts/estilos inline; nonce fica para o pós-lançamento.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'report-uri /api/csp-report',
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      ...imageHosts.map((hostname) => ({ protocol: 'https' as const, hostname })),
      ...(isDev ? [{ protocol: 'https' as const, hostname: 'placeholder.local' }] : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          ...(isDev ? [] : [{ key: 'Content-Security-Policy-Report-Only', value: csp }]),
        ],
      },
    ];
  },
};

export default nextConfig;