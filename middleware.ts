import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Admin sayfalarını kontrol et (login sayfası hariç)
  if (
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.includes('/admin/login')
  ) {
    // Admin cookie'sini kontrol et
    const adminSessionCookie = request.cookies.get('admin_session');
    
    // Giriş yapılmamışsa login sayfasına yönlendir
    if (!adminSessionCookie || adminSessionCookie.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

// Middleware'in çalışacağı yollar
export const config = {
  matcher: ['/admin/:path*'],
};
