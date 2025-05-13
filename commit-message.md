# Tüm Oturumları Sonlandırma Sistemi Değişiklikleri

Bu güncellemede, tüm aktif admin oturumlarını sonlandırabilecek bir sistem eklenmiştir. Bu sayede yöneticiler, tüm cihazlarda ve tarayıcılarda açık olan admin oturumlarını tek bir tıklamayla sonlandırabilirler.

## Eklenen Özellikler

- **Oturum Versiyonlama Sistemi**: Her admin oturumu bir sürüm numarası ile ilişkilendirilir
- **Merkezi Oturum Kontrolü**: Tüm oturumlar sunucu tarafında doğrulanır
- **Tüm Oturumları Sonlandırma**: Admin panelinde "Tüm Oturumları Sonlandır" butonu ile tüm aktif oturumlar sonlandırılabilir
- **Güvenlik İyileştirmeleri**: Oturum cookie'leri ve localStorage daha güvenli şekilde yönetilmektedir

## Teknik Detaylar

1. `middleware.ts`: Oturum versiyonunu kontrol ederek güncel olmayan oturumları sonlandırır
2. `db-firebase.ts`: Oturum versiyonu yönetimi için yeni fonksiyonlar eklenmiştir
3. `admin-header.tsx`: Admin paneline oturum yönetimi kontrolleri eklenmiştir
4. `admin/logout-all/route.ts`: Tüm oturumları sonlandırmak için yeni API uç noktası

Bu güncellemeyle birlikte, yetkisiz kişilerin admin paneline erişimi daha etkin şekilde engellenmiş ve oturum yönetimi daha güvenli hale getirilmiştir.
