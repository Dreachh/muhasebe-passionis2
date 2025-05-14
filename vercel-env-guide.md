# Vercel Ortam Değişkenlerini Yükleme Kılavuzu

Bu kılavuz, Vercel projenize çevre değişkenlerini nasıl yükleyeceğinizi açıklar.

## 1. Vercel CLI Kurulumu (İlk kez kullanacaklar için)

```bash
# Vercel CLI'yı yükleyin
npm install -g vercel

# Vercel hesabınıza giriş yapın
vercel login
```

## 2. .env.local Dosyasından Değişkenleri Yükleme

.env.local dosyası projenizin ana dizininde bulunmalıdır. Vercel CLI kullanarak bu dosyadaki değişkenleri otomatik olarak yükleyebilirsiniz:

```bash
# Projenin bulunduğu dizinde çalıştırın
vercel env pull .env.local
vercel env push
```

## 3. Vercel Web Arayüzü ile Çevre Değişkenlerini Yönetme

1. [Vercel Dashboard](https://vercel.com/dashboard)'a giriş yapın
2. Projelerinizden "muhasebe-passionis2" projesini seçin
3. "Settings" sekmesine tıklayın
4. "Environment Variables" bölümünü seçin
5. Buradan çevre değişkenlerini ekleyebilir, düzenleyebilir veya silebilirsiniz

## 4. Önemli Notlar

- Çevre değişkenlerini güncelledikten sonra yeni bir dağıtım (deployment) yapmanız gerekebilir
- Değişkenler `NEXT_PUBLIC_` ön eki olmadan tanımlanırsa, yalnızca sunucu tarafında erişilebilir
- `NEXT_PUBLIC_` ön ekine sahip değişkenler hem istemci hem de sunucu tarafında erişilebilir

## 5. Komut Satırı ile Değişkenleri Tek Tek Ekleme

```bash
# Bir değişken eklemek için
vercel env add VARIABLE_NAME production

# Bir değişkeni silmek için
vercel env rm VARIABLE_NAME production
```

## 6. Değişiklikleri Uygulama

Çevre değişkenlerini güncelledikten sonra, değişikliklerin uygulanması için yeni bir dağıtım yapmanız gerekir:

```bash
vercel deploy --prod
```
