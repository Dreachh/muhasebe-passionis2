// İzin verilen kullanıcılar listesi
export const ALLOWED_USER_IDS = [
  "AKymBhmYDJcKyUAJGK0zHZF4tOn1",  // Mevcut Google kullanıcı ID'si
  "rx2gietRHXNMDPIXeLDTbqMHvIB2",  // E-posta ve şifre ile giriş için kullanıcı ID'si
  "FrAnFfKaDaSTQ2lsjr4dOYPgYWf1",  // Google ile giriş için eklenen yeni kullanıcı ID'si
  
  // Yeni kullanıcılar eklemek için aşağıdaki şekilde ID'leri ekleyebilirsiniz
  // "KULLANICI_ID_2",
  // "KULLANICI_ID_3",
  
  // ÖRNEK:
  // "L8qvHfDlP2UcYZ9nR0xTjM7kS3v1",  // İkinci admin kullanıcı
];

// İzin verilen e-posta adresleri listesi
export const ALLOWED_EMAILS = [
  "admin@passionis.com",
  "info@passionis.com",
  "passionisistravel@gmail.com",
  // Bu listeyi ihtiyacınıza göre düzenleyebilirsiniz
];

// Kullanıcı ID'sinin izin verilenler listesinde olup olmadığını kontrol eder
export function isAllowedUser(userId: string): boolean {
  return ALLOWED_USER_IDS.includes(userId);
}

// E-posta adresinin izin verilenler listesinde olup olmadığını kontrol eder
export function isAllowedEmail(email: string): boolean {
  return ALLOWED_EMAILS.includes(email);
}

// Kullanıcı ID'si veya e-posta adresine dayalı kombinasyonlu kontrol
export function isUserAuthorized(userId: string | null, email: string | null): boolean {
  if (userId && isAllowedUser(userId)) {
    return true;
  }
  
  if (email && isAllowedEmail(email)) {
    return true;
  }
  
  return false;
}
