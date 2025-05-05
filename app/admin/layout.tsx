'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Login sayfası hariç tüm admin sayfalarında giriş kontrolü yap
    if (pathname !== '/admin/login') {
      const isLoggedIn = localStorage.getItem('adminLoggedIn');
      if (!isLoggedIn) {
        router.push('/admin/login');
      }
    }
  }, [pathname, router]);

  return <>{children}</>;
} 