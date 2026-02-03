import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bio Link | thecueRoom',
  description: 'Public artist bio link',
};

export default function BioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      {children}
    </div>
  );
}
