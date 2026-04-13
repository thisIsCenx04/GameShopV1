'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, token, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Don't act until Zustand has finished rehydrating from localStorage
    if (!_hasHydrated) return;

    if (!token || !user) {
      router.push('/login');
      return;
    }
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      router.push('/');
    }
  }, [token, user, roles, router, _hasHydrated]);

  // Still hydrating — show loading spinner instead of redirecting
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-heading">Đang tải...</div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        Đang chuyển hướng...
      </div>
    );
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  return <>{children}</>;
}
