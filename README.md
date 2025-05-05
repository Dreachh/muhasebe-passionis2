# Muhasebe & Tur Satış Uygulaması

Bu proje, finans ve tur satış işlemlerini yönetmek için geliştirilmiş bir Next.js tabanlı web uygulamasıdır.

## Özellikler
- Otomatik örnek/test verisi yükleme (ilk açılışta)
- Şirket, gider türü, sağlayıcı, aktivite ve destinasyon yönetimi
- IndexedDB ile lokal veri saklama
- Modern ve temiz arayüz (React + Radix UI)
- Kolay geliştirme ve dağıtım

## Kurulum

### 1. Gerekli Araçlar
- Node.js (18.x veya üzeri önerilir)
- npm veya yarn (varsayılan: npm)

### 2. Projeyi Klonla
```bash
git clone <bu-repo-linki>
cd muhasebe-passionis
```

### 3. Bağımlılıkları Yükle
```bash
npm install
```

### 4. Geliştirme Sunucusunu Başlat
```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini aç.

## Vercel Deploy
1. Bu klasörü yeni bir Github reposu olarak yükle.
2. Vercel hesabında yeni bir proje oluştur, Github reposunu seç.
3. "Framework Preset" olarak **Next.js** seçili olmalı.
4. Varsayılan ayarlar ile deploy et.

Ekstra .env dosyası gerekmez. Tüm örnek veriler ve ayarlar kodda gömülüdür.

## Notlar
- İlk açılışta örnek veriler otomatik yüklenir, tekrar yüklenmez.
- Test ve gerçek veriler için kolayca genişletilebilir.
- Hata veya önerilerin için issue açabilirsin.

---

**Kolay gelsin!**
