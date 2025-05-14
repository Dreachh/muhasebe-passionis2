import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware'de Firebase kontrolü için promise tabanlı fetch fonksiyonu
async function fetchSessionVersion() {
  try {
    // Tam URL kullan ve cache'leme sorunlarını önlemek için timestamp ekle
    const timestamp = Date.now();
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
      
    const response = await fetch(`${baseUrl}/api/admin/session-version?t=${timestamp}`, {
      cache: 'no-store', // Cache'leme olmasın, her zaman güncel veri
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.version;
    }
    return 1; // Varsayılan versiyon
  } catch (error) {
    console.error('Session versiyon kontrol hatası:', error);
    return 1;  // Hata durumunda varsayılan versiyon
  }
}

export async function middleware(request: NextRequest) {
  // URL ve HTTP başlık bilgilerini konsola yaz (debugging)
  console.log('Middleware çalışıyor - URL:', request.nextUrl.pathname);
  
  // Admin sayfalarını kontrol et (login sayfası hariç)
  if (
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.includes('/admin/login') &&
    !request.nextUrl.pathname.includes('/admin/setup') &&
    !request.nextUrl.pathname.includes('/api/admin')
  ) {
    // Admin cookie'lerini kontrol et
    const adminSessionCookie = request.cookies.get('admin_session');
    const sessionVersionCookie = request.cookies.get('session_version');
    const adminClientCookie = request.cookies.get('adminLoggedInClient');
    
    console.log('Admin cookie kontrolü:', {
      adminSessionCookie: adminSessionCookie ? 'var' : 'yok',
      sessionVersionCookie: sessionVersionCookie ? 'var' : 'yok',
      adminClientCookie: adminClientCookie ? 'var' : 'yok'
    });
    
    // Tüm oturum kontrollerini bir arada yap
    if (!adminSessionCookie || adminSessionCookie.value !== 'authenticated' || !adminClientCookie) {
      console.log('Admin girişi yapılmamış veya eksik oturum bilgisi var, login sayfasına yönlendiriliyor');
      
      // Temizleme işlemleri - yanıtta cookie'leri sıfırlayalım
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.set({
        name: 'admin_session',
        value: '',
        expires: new Date(0),
        path: '/',
      });
      
      response.cookies.set({
        name: 'session_version',
        value: '',
        expires: new Date(0),
        path: '/',
      });
      
      response.cookies.set({
        name: 'adminLoggedInClient',
        value: '',
        expires: new Date(0),
        path: '/',
      });
      
      return response;
    }
    
  // Oturum versiyonu kontrolü yap
    if (sessionVersionCookie) {
      try {
        // Geçerli oturum versiyonunu kontrol et
        const currentVersion = parseInt(sessionVersionCookie.value, 10);
        const latestVersion = await fetchSessionVersion();
        
        console.log('Versiyon kontrolü:', { currentVersion, latestVersion });
        
        // Eğer cookie'deki versiyon güncel değilse, oturum geçersiz
        if (currentVersion < latestVersion) {
          console.log('Oturum versiyonu eski, login sayfasına yönlendiriliyor');
          
          // Temizleme işlemleri - yanıtta cookie'leri sıfırlayalım
          const response = NextResponse.redirect(new URL('/admin/login?expired=true', request.url));
          
          // Cookie'leri temizle
          response.cookies.set({
            name: 'admin_session',
            value: '',
            expires: new Date(0),
            path: '/',
          });
          
          response.cookies.set({
            name: 'session_version',
            value: '',
            expires: new Date(0),
            path: '/',
          });
          
          return response;
        }
      } catch (error) {
        console.error('Oturum versiyon kontrolü hatası:', error);
      }
    } else {
      // Session version cookie yoksa da login'e yönlendir
      console.log('Oturum versiyon bilgisi yok, login sayfasına yönlendiriliyor');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

// Middleware'in çalışacağı yollar
export const config = {
  matcher: ['/admin/:path*'],
};
