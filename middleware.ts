import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin giriş kontrolü kaldırıldı, artık direkt uygulama açılacak
export async function middleware(request: NextRequest) {
  // URL ve HTTP başlık bilgilerini konsola yaz (debugging)
  console.log('Middleware çalışıyor - URL:', request.nextUrl.pathname);
  
  // Admin sayfalarına giriş yapmaya çalışan kullanıcıyı ana sayfaya yönlendir
  if (request.nextUrl.pathname.startsWith('/admin/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Admin sayfalarına otomatik olarak giriş yapılmış gibi davran
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const response = NextResponse.next();
    
    // Admin oturumunu otomatik olarak ayarla (cookie'ler 30 gün geçerli)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    
    response.cookies.set({
      name: 'admin_session',
      value: 'authenticated',
      expires: expires,
      path: '/',
    });
    
    response.cookies.set({
      name: 'session_version',
      value: '999', // Yüksek bir versiyon numarası ile her zaman güncel olacak
      expires: expires,
      path: '/',
    });
    
    response.cookies.set({
      name: 'adminLoggedInClient',
      value: 'true',
      expires: expires,
      path: '/',
    });
    
    return response;
  }

  return NextResponse.next();
}

// Middleware'in çalışacağı yollar
export const config = {
  matcher: ['/', '/admin/:path*'],
};
