import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';

import Layout from '@/components/Layout';
import { Providers } from './providers';

import './globals.css';
import FloatingIcon from '@/components/FloatingIcon';
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://axionlighting.com'),
  title: 'Axion Lighting Solutions',
  description:
    'Premium indoor and outdoor lighting solutions. Modern, trustworthy, and luxurious designs with a warm touch.',
  keywords: 'lighting, indoor lighting, outdoor lighting, premium, modern, luxury, axion',
  openGraph: {
    title: 'Axion Lighting Solutions',
    description:
      'Premium indoor and outdoor lighting solutions. Modern, trustworthy, and luxurious designs with a warm touch.',
    type: 'website',
    locale: 'en_US',
    url: 'https://axionlighting.com',
    siteName: 'Axion Lighting Solutions',
    images: [
      {
        url: '/Logo.svg',
        width: 1200,
        height: 630,
        alt: 'Axion Lighting Solutions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Axion Lighting Solutions',
    description: 'Premium indoor and outdoor lighting solutions.',
    images: ['/Logo.svg'],
  },
  icons: {
    icon: '/Logo.svg',
    shortcut: '/Logo.svg',
    apple: '/Logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-poppins`}>
        <Providers>
          <Layout>{children}</Layout>

        </Providers>
        <FloatingIcon/>
      </body>
    </html>
  );
}
