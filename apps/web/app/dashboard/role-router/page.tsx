'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRoleRouter() {
  const router = useRouter();

  useEffect(() => {
    async function redirectToDashboard() {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) {
          router.replace('/');
          return;
        }

        const session = await res.json();
        if (!session.user) {
          router.replace('/');
          return;
        }

        const role = session.user.role || 'user';

        switch (role) {
          case 'admin':
            router.replace('/dashboard/admin');
            break;
          case 'artist':
            router.replace('/dashboard/artist');
            break;
          default:
            router.replace('/dashboard/user');
        }
      } catch (error) {
        console.error('Dashboard routing error:', error);
        router.replace('/');
      }
    }

    redirectToDashboard();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
      <div className="text-white">Loading dashboard...</div>
    </div>
  );
}