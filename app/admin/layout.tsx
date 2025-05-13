'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminHeader } from '@/components/admin-header';
import { Toaster } from '@/components/ui/toaster';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Login sayfası veya setup sayfası hariç tüm admin sayfalarında giriş kontrolü yap
    if (pathname !== '/admin/login' && pathname !== '/admin/setup') {
      // Cookie ve localStorage kontrolü birlikte yap
      const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
      
      console.log('Admin layout kontrolü: isLoggedIn =', isLoggedIn);
      
      if (!isLoggedIn) {
        console.log('Admin yetkisi yok, login sayfasına yönlendiriliyor');
        // Kullanıcı giriş yapmamış, login sayfasına yönlendir
        router.replace('/admin/login');
      } else {
        // Oturum süresini kontrol et
        const expiredParam = new URLSearchParams(window.location.search).get('expired');
        if (expiredParam === 'true') {
          localStorage.removeItem('adminLoggedIn');
          sessionStorage.removeItem('adminLoggedIn');
          document.cookie = "adminLoggedInClient=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          router.replace('/admin/login?message=session_expired');
          return;
        }
        
        setIsAuthorized(true);
      }
    } else {
      // Login sayfası veya setup sayfası için yetki kontrolü yok
      setIsAuthorized(true);
    }
    setIsLoading(false);
  }, [pathname, router]);

  // Yükleme sırasında boş sayfa göster
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  }

  // Yetkisiz kullanıcılar için boş sayfa
  if (!isAuthorized && pathname !== '/admin/login' && pathname !== '/admin/setup') {
    return null; // Router zaten yönlendirme yapacak
  }

  // Admin başlığını sadece giriş yapıldıysa ve login sayfasında değilse göster
  const showAdminHeader = isAuthorized && pathname !== '/admin/login' && pathname !== '/admin/setup';

  return (
    <>
      {showAdminHeader && <AdminHeader />}
      {children}
      <Toaster />
    </>
  );
}