'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppFrame, FullScreenLoader } from '@/components/shell/AppFrame';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login');
    }
  }, [isLoading, session, router]);

  if (isLoading || !session) {
    return <FullScreenLoader />;
  }

  return <AppFrame variant="member">{children}</AppFrame>;
}
