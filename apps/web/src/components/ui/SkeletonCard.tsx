'use client';

export function SkeletonCard({ variant = 'default' }: { variant?: 'default' | 'wide' }) {
  return (
    <div className={`animate-pulse bg-[#111] border border-[#1a1a1a] rounded-xl ${variant === 'wide' ? 'h-64' : 'h-48'}`}>
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}
