import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminCredentials } from '@/lib/db-firebase';
import { getMockAdminCredentials } from '@/lib/mock-admin';

// Admin oturumu oluşturma fonksiyonu
function createAdminSession() {
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat
  
  // Cookie'ye kimlik bilgilerini değil, sadece giriş yaptığı bilgisini kaydet
  cookies().set('admin_session', 'authenticated', {
    expires: expiry,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
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
        if (username === adminCredentials.username && password === adminCredentials.password) {
          // Giriş başarılı
          createAdminSession();
          return NextResponse.json({ success: true });
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
        }, { status: 500 });
      }
      // Kullanıcı adı ve şifre kontrolü (mock veriler ile)
    if (username === mockCredentials.username && password === mockCredentials.password) {
      // Giriş başarılı, session oluştur
      createAdminSession();
      return NextResponse.json({ success: true });
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
