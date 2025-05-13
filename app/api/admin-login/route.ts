import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminCredentials, getSessionVersion } from '@/lib/db-firebase';
import { getMockAdminCredentials } from '@/lib/mock-admin';

// Admin oturumu oluşturma fonksiyonu
async function createAdminSession() {
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat
  
  // Geçerli oturum versiyonunu al
  const sessionVersion = await getSessionVersion();
  
  return {
    sessionVersion,
    cookieOptions: {
      expires: expiry,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const // TypeScript'e 'strict' değerinin bir literal tip olduğunu belirtiyoruz
    }
  };
}

// Admin giriş kontrol işlemi için API endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    // Kullanıcı adı ve şifre kontrolü
    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Kullanıcı adı ve şifre gereklidir' 
      }, { status: 400 });
    }

    try {
      // Önce Firebase'den almayı dene
      const adminCredentials = await getAdminCredentials();
        // Eğer Firebase'de bilgi varsa kullan
      if (adminCredentials.username && adminCredentials.password) {
        // Admin kimlik bilgileri kontrol et ve devam et
        if (username === adminCredentials.username && password === adminCredentials.password) {        // Giriş başarılı
          const sessionData = await createAdminSession();
          const response = NextResponse.json({ success: true, sessionVersion: sessionData.sessionVersion });
          
          // Cookie'leri response'a ekle
          response.cookies.set({
            name: 'admin_session',
            value: 'authenticated',
            ...sessionData.cookieOptions
          });
          
          response.cookies.set({
            name: 'session_version',
            value: sessionData.sessionVersion.toString(),
            ...sessionData.cookieOptions
          });
          
          return response;
        }
        
        return NextResponse.json({ 
          success: false, 
          error: 'Kullanıcı adı veya şifre hatalı' 
        }, { status: 401 });
      }
      
      // Firebase'de bilgi yoksa mock verileri kullan
      console.log("Firebase'de admin bilgileri bulunamadı, mock veriler kullanılacak");
      const mockCredentials = await getMockAdminCredentials();
      
      // Mock admin kimlik bilgileri bulunamadıysa
      if (!mockCredentials.username || !mockCredentials.password) {
        return NextResponse.json({ 
          success: false, 
          error: 'Admin kimlik bilgileri bulunamadı' 
        }, { status: 500 });      }
      
      // Kullanıcı adı ve şifre kontrolü (mock veriler ile)
      if (username === mockCredentials.username && password === mockCredentials.password) {        // Giriş başarılı, session oluştur
        const sessionData = await createAdminSession();
        const response = NextResponse.json({ success: true, sessionVersion: sessionData.sessionVersion });
          
        // Cookie'leri response'a ekle
        response.cookies.set({
          name: 'admin_session',
          value: 'authenticated',
          ...sessionData.cookieOptions
        });
        
        response.cookies.set({
          name: 'session_version',
          value: sessionData.sessionVersion.toString(),
          ...sessionData.cookieOptions
        });
        
        return response;
      }
      
      // Giriş başarısız
      return NextResponse.json({ 
        success: false, 
        error: 'Kullanıcı adı veya şifre hatalı' 
      }, { status: 401 });
    } catch (error) {
      console.error("Admin kimlik kontrolü hatası:", error);
      return NextResponse.json({ 
        success: false, 
        error: 'Kimlik doğrulama sırasında bir hata oluştu' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Admin girişi sırasında hata:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Giriş işlemi sırasında bir hata oluştu' 
    }, { status: 500 });
  }
}
