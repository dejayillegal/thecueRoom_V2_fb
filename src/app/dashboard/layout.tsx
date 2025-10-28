import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentUser } from '@/lib/auth';

const DashboardLoadingShell = () => (
  <div className="flex h-screen w-screen">
    <div className="hidden md:block w-[256px] bg-background p-4">
      <Skeleton className="h-10 w-3/4 mb-8" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
    <div className="flex-1 flex flex-col">
      <header className="flex h-16 shrink-0 items-center justify-end gap-4 bg-background/95 px-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </header>
      <main className="flex-1 bg-muted/40 p-6 md:p-8">
        <Skeleton className="h-full w-full" />
      </main>
    </div>
  </div>
);

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  return (
    <Suspense fallback={<DashboardLoadingShell />}>
      {children}
    </Suspense>
  );
}