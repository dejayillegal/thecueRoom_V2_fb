
import type { Metadata } from 'next';
import { Inter, Source_Code_Pro } from 'next/font/google';
import { AuthProvider } from '@/lib/firebase/AuthProvider';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: 'variable',
});

const scp = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'thecueRoom',
  description: 'Creative studio platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className='dark'>
      <body className={`${inter.variable} ${scp.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right" theme="dark" />
      </body>
    </html>
  );
}
