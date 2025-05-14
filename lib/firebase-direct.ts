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

    // Eğer zaten başarıyla başlatılmışsa, önbelleğe alınan değerleri döndür
    if (_initialized && app && db) {
      console.log('Firebase zaten başarıyla başlatılmış, önbelleğe alınmış instance kullanılıyor');
      return { success: true, app, db };
    }

    // Zaten başlatılmış uygulamayı kontrol et
    if (getApps().length > 0) {
      try {
        app = getApps()[0];
        db = getFirestore(app);
        _initialized = true;
        console.log('Firebase zaten başlatılmış, mevcut instance kullanılıyor');
        return { success: true, app, db };
      } catch (appError) {
        console.error('Firebase mevcut instance erişim hatası:', appError);
        // Hata oluşursa yeni bir instance oluşturmayı dene
      }
    }
    
    // Yeni bir Firebase uygulaması başlat
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      _initialized = true;
      console.log('Firebase başarıyla başlatıldı');
      return { success: true, app, db };
    } catch (initError) {
      console.error('Firebase başlatma hatası:', initError);
      return { success: false };
    }
  } catch (error) {
    console.error('Firebase başlatma işlemi esnasında beklenmeyen hata:', error);
    return { success: false };
  }
}

// Mevcut Firebase Firestore veritabanına erişim
export function getDb(): Firestore | undefined {
  if (!db && typeof window !== 'undefined') {
    try {
      const { success, db: newDb } = initializeFirebaseClient();
      if (success && newDb) {
        db = newDb;
      }
    } catch (error) {
      console.error('Firestore erişim hatası:', error);
    }
  }
  return db;
}

// Firebase Firestore'u başlatmayı deneyip sonucu döndüren basit fonksiyon
export function ensureFirestore(): boolean {
  const { success } = initializeFirebaseClient();
  return success;
}

// Doğrudan Firestore bağlantısını al - bu sunucu tarafında hataya neden olabileceği için kaldırıldı
// export { db };
