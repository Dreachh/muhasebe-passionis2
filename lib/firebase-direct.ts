/**
 * firebase-direct.ts
 * 
 * Bu dosya, Firebase'e doğrudan erişim için basitleştirilmiş ve sağlamlaştırılmış bir API sağlar.
 * Hata durumlarına karşı daha dayanıklı olması için tasarlandı.
 */

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

// Firebase'i istemci tarafında başlatmak için güvenli fonksiyon
export function initializeFirebaseClient(): { success: boolean; app?: FirebaseApp; db?: Firestore } {
  try {
    // Tarayıcı ortamında olduğumuzu kontrol et
    if (typeof window === 'undefined') {
      console.warn('Server tarafında Firebase başlatılamaz');
      return { success: false };
    }

    // Zaten başlatılmış uygulamayı kontrol et
    if (getApps().length > 0) {
      app = getApps()[0];
      db = getFirestore(app);
      console.log('Firebase zaten başlatılmış, mevcut instance kullanılıyor');
      return { success: true, app, db };
    }
    
    // Yeni bir Firebase uygulaması başlat
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase başarıyla başlatıldı');
    
    return { success: true, app, db };
  } catch (error) {
    console.error('Firebase başlatma hatası:', error);
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

// Doğrudan Firestore bağlantısını al
export { db };
