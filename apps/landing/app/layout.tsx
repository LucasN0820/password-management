import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { localeFromAcceptLanguage } from './i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vault — 极简密码管理器 · A quiet password manager',
  description:
    'Vault is a local-first password manager for storing, generating, and organizing digital credentials. Vault 是一款本地优先的密码管理器。',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const locale = localeFromAcceptLanguage(
    requestHeaders.get('accept-language')
  );

  return (
    <html lang={locale === 'zh' ? 'zh-CN' : 'en'}>
      <body className='min-h-screen font-sans antialiased'>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
