import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import FooterLinks from '@/components/FooterLinks';
import AppShell from '@/components/AppShell';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'thecueRoom',
  description: 'Your music production hub',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://picsum.photos" />
      </head>
      <body className={`${inter.className} antialiased`} style={{ background: '#000000', minHeight: '100vh' }}>
        <AppShell>
          {children}
        </AppShell>
        <FooterLinks />
      </body>
    </html>
  );
}