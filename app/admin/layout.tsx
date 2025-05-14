'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminHeader } from '@/components/admin-header';
import { Toaster } from '@/components/ui/toaster';
import { isFirebaseInitialized } from '@/lib/firebase-client-module';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionInterval, setSessionInterval] = useState<NodeJS.Timeout | null>(null);

  // Oturum kontrolü - Firebase'den sorgulama yaparak güncel versiyon kontrolü
  const checkSessionVersion = async () => {
    try {
      // Tarayıcı kapatıldığında veya internet koptuğunda API çağrısı yapılamayabilir
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/session-version?t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      
      if (!response.ok) {
        console.error('Oturum kontrolü sırasında hata');
        return;
      }
      
      const data = await response.json();
      const serverVersion = data.version;
      
      // Cookie'deki oturum versiyonu (varsa)
      const sessionVersionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('session_version='))
        ?.split('=')[1];
        
      const clientVersion = sessionVersionCookie ? parseInt(sessionVersionCookie, 10) : 0;
      
      console.log('Oturum versiyon kontrolü:', { clientVersion, serverVersion });
      
      // Eğer istemci versiyonu sunucudan düşükse (yani oturum güncel değilse)
      if (clientVersion < serverVersion) {
        console.log('Oturum versiyonu değişmiş, çıkış yapılıyor');
        // Temizlik işlemleri - tüm oturum verilerini temizle
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('admin_session_version');
        localStorage.removeItem('admin_last_login');
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('admin_session_version');
        sessionStorage.removeItem('admin_last_login');
        document.cookie = "adminLoggedInClient=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "session_version=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        router.replace('/admin/login?message=session_expired');
      }
    } catch (error) {
      console.error('Oturum kontrolü hatası:', error);
    }
  };

  // Firebase başlatma fonksiyonu - daha güvenli sürüm
  const initializeFirebaseClient = () => {
    try {
      console.log('Admin layout - Firebase başlatma işlemi');
      if (typeof window !== 'undefined') {
        return isFirebaseInitialized();
      } else {
        console.warn('Admin layout - Server tarafında Firebase başlatılamaz');
        return false;
      }
    } catch (error) {
      console.error('Firebase başlatma hatası:', error);
      return false;
    }
  };
  
  useEffect(() => {
    // Firebase'i başlat
    const fbInitialized = initializeFirebaseClient();
    console.log('Firebase başlatma sonucu:', fbInitialized ? 'Başarılı' : 'Başarısız');
    
    // Login sayfası veya setup sayfası hariç tüm admin sayfalarında giriş kontrolü yap
    if (pathname !== '/admin/login' && pathname !== '/admin/setup') {
      // SessionStorage (tarayıcı kapatınca silinir) ve localStorage (tarayıcı kapatınca silinmez) kontrolü birlikte yap
      try {
        const isLoggedInSession = sessionStorage.getItem('adminLoggedIn') === 'true';
        const isLoggedInLocal = localStorage.getItem('adminLoggedIn') === 'true';
        
        console.log('Admin layout kontrolü:', { isLoggedInSession, isLoggedInLocal });
        
        if (!isLoggedInSession || !isLoggedInLocal) {
          console.log('Admin yetkisi yok, login sayfasına yönlendiriliyor');
          // Kullanıcı giriş yapmamış veya tarayıcı kapatılıp açılmış
          
          // Tarayıcı kapatıldığında özel mesaj göster
          const message = isLoggedInLocal && !isLoggedInSession 
            ? '?message=browser_closed' 
            : '';
          
          router.replace(`/admin/login${message}`);
        } else {
          // Oturum süresini kontrol et
          const expiredParam = new URLSearchParams(window.location.search).get('expired');
          if (expiredParam === 'true') {
            sessionStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoggedIn');
            document.cookie = "adminLoggedInClient=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "session_version=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            router.replace('/admin/login?message=session_expired');
            return;
          }
          
          // Düzenli oturum kontrolü başlat (her 30 saniyede bir)
          const interval = setInterval(checkSessionVersion, 30000);
          setSessionInterval(interval);
          
          // İlk kontrolü hemen yap
          checkSessionVersion();
          
          setIsAuthorized(true);
        }
      } catch (storageError) {
        console.error('Storage erişimi hatası:', storageError);
        router.replace('/admin/login?error=storage');
      }
    } else {
      // Login sayfası veya setup sayfası için yetki kontrolü yok
      setIsAuthorized(true);
    }
    setIsLoading(false);
  }, [pathname, router]);

  // Temizlik işlemi
  useEffect(() => {
    // Component kaldırıldığında interval'i temizle
    return () => {
      if (sessionInterval) {
        clearInterval(sessionInterval);
      }
    };
  }, [sessionInterval]);

  // Sayfa yüklendiğinde ve odaklandığında oturum kontrolü yap
  useEffect(() => {
    // Sayfa görünür olduğunda kontrol et (başka sekmeden geri dönüldüğünde)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Sayfa odaklandı, oturum kontrolü yapılıyor');
        checkSessionVersion();
      }
    };
    
    // Tarayıcı oturumu kontrolü (tarayıcı kapatıldığında sessionStorage silinir)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminLoggedIn' && e.newValue !== 'true') {
        console.log('Admin oturumu değişti, yönlendiriliyor');
        router.replace('/admin/login');
      }
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);
  
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
