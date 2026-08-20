'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? '/books' : '/login');
  }, [user, isLoading, router]);

  return <div className="flex min-h-screen items-center justify-center bg-paper text-ink/50">Yükleniyor…</div>;
}
