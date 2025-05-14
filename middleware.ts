import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Firebase Authentication ile entegre olan middleware
export async function middleware(request: NextRequest) {
  // URL ve HTTP başlık bilgilerini konsola yaz (debugging)
  console.log('Middleware çalışıyor - URL:', request.nextUrl.pathname);
  
  // Login sayfası veya api rotaları ise direkt geç
  if (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.includes('_next') ||
    request.nextUrl.pathname.includes('favicon.ico')
  ) {
    return NextResponse.next();
  }
  
  // Firebase oturum kontrolü - session cookie'yi kontrol et
  const firebaseSession = request.cookies.get('firebase_session');
  const loggedInStatus = request.cookies.get('admin_logged_in');
  
  if (!firebaseSession || !loggedInStatus) {
    console.log('Firebase oturumu bulunamadı, login sayfasına yönlendiriliyor');
    
    // Client-side tarayıcıda çalışıyorsa localStorage kontrolü yap
    // (Bu middleware server tarafında çalıştığı için tam erişemiyoruz, JS ile client tarafında kontrol edeceğiz)
    
    // Login sayfasına yönlendir
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Admin sayfalarına giriş yapmaya çalışan kullanıcıyı ana sayfaya yönlendir (eski admin sayfası kaldırıldı)
  if (request.nextUrl.pathname.startsWith('/admin/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Middleware'in çalışacağı yollar
export const config = {
  matcher: ['/', '/admin/:path*', '/((?!login|api|_next/static|_next/image|favicon.ico).*)'],
};
