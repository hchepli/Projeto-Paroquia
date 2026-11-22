// src/app/layout.tsx
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/styles/globals.css';
import { Providers } from './providers';
import { APP_META } from '@/config/brand';

const poppins = localFont({
  src: [
    { path: '../assets/fonts/poppins-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../assets/fonts/poppins-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/poppins-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/poppins-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../assets/fonts/poppins-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: APP_META.title,
  description: APP_META.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}