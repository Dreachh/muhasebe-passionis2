'use client';

/**
 * Bu modül, uygulamanın otomatik admin girişi yapmasını sağlar.
 * Admin giriş ekranı kaldırıldığından, cookie'leri otomatik olarak
 * oluşturup kullanıcıya direkt erişim sağlar.
 */

export function setupAutoLogin() {
  if (typeof window !== 'undefined') {
    // Tarayıcı ortamında çalıştığından emin ol
    console.log('Otomatik admin girişi ayarlanıyor...');
    
    // Cookie'leri kontrol et
    const hasAdminSession = document.cookie.includes('admin_session=authenticated');
    
    if (!hasAdminSession) {
      // Admin oturumunu otomatik olarak ayarla (cookie'ler 30 gün geçerli)
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      
      // Admin cookie'lerini oluştur
      document.cookie = `admin_session=authenticated; expires=${expires.toUTCString()}; path=/`;
      document.cookie = `session_version=999; expires=${expires.toUTCString()}; path=/`;
      document.cookie = `adminLoggedInClient=true; expires=${expires.toUTCString()}; path=/`;
      
      console.log('Admin oturum cookie\'leri otomatik oluşturuldu.');
    } else {
      console.log('Admin oturum cookie\'leri zaten mevcut.');
    }
  }
  
  return true;
}
