/**
 * firebase-direct.ts
 * 
 * Bu dosya, Firebase'e doğrudan erişim için basitleştirilmiş ve sağlamlaştırılmış bir API sağlar.
 * Hata durumlarına karşı daha dayanıklı olması için tasarlandı.
 */

"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

// Firebase yapılandırma bilgileri
const firebaseConfig = {
  apiKey: "AIzaSyAdAvS2I5ErlCcchaSzOP3225Qd0w1vayI",
  authDomain: "passionis-travel.firebaseapp.com",
  projectId: "passionis-travel",
  storageBucket: "passionis-travel.appspot.com",
  messagingSenderId: "1094253004348",
  appId: "1:1094253004348:web:b1a0ec2ed6d8137a2e6539",
  databaseURL: "https://passionis-travel-default-rtdb.europe-west1.firebasedatabase.app"
};

// Firebase App instance
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let _initialized = false;

// Firebase'i istemci tarafında başlatmak için güvenli fonksiyon
export function initializeFirebaseClient(): { success: boolean; app?: FirebaseApp; db?: Firestore } {
  try {
    // Tarayıcı ortamında olduğumuzu kontrol et
    if (typeof window === 'undefined') {
      console.warn('Server tarafında Firebase başlatılamaz');
      return { success: false };
    }

    console.log('Firebase başlatma işlemi başlıyor...');
    
    // Eğer zaten başarıyla başlatılmışsa, önbelleğe alınan değerleri döndür
    if (_initialized && app && db) {
      console.log('Firebase zaten başarıyla başlatılmış, önbelleğe alınmış instance kullanılıyor');
      return { success: true, app, db };
    }    // Zaten başlatılmış uygulamayı kontrol et
    if (getApps().length > 0) {
      try {
        console.log('Firebase: Mevcut uygulama bulundu, getApps().length =', getApps().length);
        app = getApps()[0];
        
        // Firebase app'in geçerli olduğunu doğrula
        if (!app || typeof app.name !== 'string') {
          console.error('Firebase: Mevcut app geçersiz, yeni oluşturmaya çalışılacak');
          throw new Error('Geçersiz Firebase app instance');
        }
        
        console.log('Firebase: Mevcut app geçerli, Firestore alınıyor:', app.name);
        db = getFirestore(app);
        
        // Firestore'un geçerli olduğunu kontrol et
        if (!db) {
          console.error('Firebase: Firestore alınamadı');
          throw new Error('Firestore instance alınamadı');
        }
        
        _initialized = true;
        console.log('Firebase zaten başlatılmış, mevcut instance başarıyla kullanıldı');
        return { success: true, app, db };
      } catch (appError) {
        console.error('Firebase mevcut instance erişim hatası:', appError);
        // Hata oluşursa yeni bir instance oluşturmayı dene
        _initialized = false; // Başarısız oldu, bu nedenle durumu sıfırla
      }
    }
    
    // Yeni bir Firebase uygulaması başlat
    try {
      console.log('Firebase: Yeni bir app başlatılıyor...');
      
      // Tüm mevcut uygulamaları temizle (varsa)
      try {
        getApps().forEach(app => {
          console.log(`Firebase: Eski app temizleniyor: ${app.name}`);
        });
      } catch (cleanupError) {
        console.warn('Firebase: Eski app temizleme hatası:', cleanupError);
      }
      
      app = initializeApp(firebaseConfig);
      console.log('Firebase: App başlatıldı:', app.name);
      
      db = getFirestore(app);
      console.log('Firebase: Firestore alındı');
      
      _initialized = true;
      console.log('Firebase başarıyla başlatıldı');
      return { success: true, app, db };
    } catch (initError) {
      console.error('Firebase başlatma hatası:', initError);
      _initialized = false;
      app = undefined;
      db = undefined;
      return { success: false };
    }
  } catch (error) {
    console.error('Firebase başlatma işlemi esnasında beklenmeyen hata:', error);
    return { success: false };
  }
}

// Mevcut Firebase Firestore veritabanına erişim - geliştirilmiş güvenlik kontrolü ile
export function getDb(): Firestore | undefined {
  // Sunucu tarafında çalıştırılmaya çalışılıyorsa hemen undefined dön
  if (typeof window === 'undefined') {
    console.warn('Server tarafında getDb() çağrıldı, undefined dönülüyor');
    return undefined;
  }

  // Eğer db zaten oluşturulmuşsa doğrudan döndür
  if (db) {
    return db;
  }
  
  try {
    console.log('getDb: Firebase Firestore instance oluşturuluyor...');
    const { success, db: newDb } = initializeFirebaseClient();
    
    if (success && newDb) {
      console.log('getDb: Firebase Firestore instance başarıyla alındı');
      db = newDb;
      return db;
    } else {
      console.error('getDb: Firestore instance oluşturulamadı');
      return undefined;
    }
  } catch (error) {
    console.error('getDb: Firestore erişim hatası:', error);
    return undefined;
  }
}

// Firebase Firestore'u başlatmayı deneyip sonucu döndüren basit fonksiyon
export function ensureFirestore(): boolean {
  const { success } = initializeFirebaseClient();
  return success;
}

// Doğrudan Firestore bağlantısını al - bu sunucu tarafında hataya neden olabileceği için kaldırıldı
// export { db };
