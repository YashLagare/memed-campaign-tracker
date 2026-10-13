'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

export function AuthGuard({ children, allowedRole }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (allowedRole && user.role !== allowedRole) {
        // Redirect to their own dashboard
        router.push(user.role === 'brand' ? '/brand' : '/creator');
      }
    }
  }, [user, isLoading, allowedRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500">Verifying session...</p>
      </div>
    );
  }

  if (!user || (allowedRole && user.role !== allowedRole)) {
    return null;
  }

  return <>{children}</>;
}
