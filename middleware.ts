import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware'de Firebase kontrolü için promise tabanlı fetch fonksiyonu
async function fetchSessionVersion() {
  try {
    const response = await fetch(process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/admin/session-version`
      : 'http://localhost:3000/api/admin/session-version');
    
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
    // Admin cookie'sini kontrol et
    const adminSessionCookie = request.cookies.get('admin_session');
    const sessionVersionCookie = request.cookies.get('session_version');
    
    console.log('Admin cookie kontrolü:', adminSessionCookie ? 'cookie var' : 'cookie yok');
    
    // Giriş yapılmamışsa login sayfasına yönlendir
    if (!adminSessionCookie || adminSessionCookie.value !== 'authenticated') {
      console.log('Admin girişi yapılmamış, login sayfasına yönlendiriliyor');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // Oturum versiyonu kontrolü yap
    if (sessionVersionCookie) {
      try {
        // Geçerli oturum versiyonunu kontrol et
        const currentVersion = parseInt(sessionVersionCookie.value, 10);
        const latestVersion = await fetchSessionVersion();
        
        // Eğer cookie'deki versiyon güncel değilse, oturum geçersiz
        if (currentVersion < latestVersion) {
          console.log('Oturum versiyonu eski, login sayfasına yönlendiriliyor');
          return NextResponse.redirect(new URL('/admin/login?expired=true', request.url));
        }
      } catch (error) {
        console.error('Oturum versiyon kontrolü hatası:', error);
      }
    }
  }

  return NextResponse.next();
}

// Middleware'in çalışacağı yollar
export const config = {
  matcher: ['/admin/:path*'],
};
