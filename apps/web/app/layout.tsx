import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '../src/styles/performance.css';
import FooterLinks from '@/components/FooterLinks';
import { Toaster } from '@/components/ui/toaster';
import { startIngestionScheduler } from '@thecueroom/db/scheduler';
import AppShell from '@/components/AppShell';

// Start the feed ingestion scheduler once during server startup
if (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE !== 'phase-production-build') {
  startIngestionScheduler().catch(err => {
    console.error('Failed to start ingestion scheduler:', err);
  });
}

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
        <Toaster />
      </body>
    </html>
  );
}