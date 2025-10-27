
import { cookies } from 'next/headers';
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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
  const token = cookies().get('thecue_session')?.value;
  
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.log('DashboardLayout: No session cookie found. Redirecting to /.');
    }
    redirect('/');
  }

  try {
    if (!adminAuth) {
      // This case should be handled by the adminAuth module, but as a safeguard:
      console.error("DashboardLayout: Firebase Admin SDK not initialized on the server.");
      redirect('/');
    }

    // The `true` checks for signature validity without checking revocation, which is the
    // recommended, high-performance practice for session cookies.
    const decoded = await adminAuth.verifyIdToken(token, true);
    if (!decoded) {
      // This case is rare if verifyIdToken is used correctly, but good to have.
      if (process.env.NODE_ENV === 'development') {
        console.warn('DashboardLayout: Invalid token in cookie. Redirecting to /.');
      }
      redirect('/');
    }

    if(adminFirestore) {
      const isAdminCheck = await adminFirestore.doc(`admins/${decoded.uid}`).get();
      if (decoded.email === process.env.ADMIN_EMAIL || isAdminCheck?.exists) {
          // This is a simple way to denote admin status without complex claims for now
          // A proper implementation might add a custom claim and check it here.
      }
    }
    
    // If we reach here, the token is valid.
    return (
        <Suspense fallback={<DashboardLoadingShell />}>
            {children}
        </Suspense>
    );
  } catch (err: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('DashboardLayout: Token verification failed:', err.message);
    }
    // Any error during verification (expired, malformed, etc.) should lead to a redirect.
    redirect('/');
  }
}
