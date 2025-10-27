'use client';

import { useAuth } from '@/lib/firebase/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignInPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user) {
            router.replace('/dashboard');
        }
        if (!isLoading && !user) {
            // This is now handled by the modal on the landing page.
            // If a user lands here directly, redirect them home.
            router.replace('/');
        }
    }, [user, isLoading, router]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-black">
            <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#D1FF3D] border-r-transparent"></div>
                <p className="mt-4 text-white">Redirecting...</p>
            </div>
        </div>
    );
}
