
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
      <body className={`${inter.className} antialiased`} style={{ background: 'hsl(var(--background))' }} suppressHydrationWarning>
        <div className="min-h-screen bg-[#0B0B0B]">
          {children}
        </div>
      </body>
    </html>
  );
}
