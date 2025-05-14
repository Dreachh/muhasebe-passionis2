'use client';

/**
 * Bu dosya, Firebase modüllerini istemci tarafında kullanmak için özel bir modül sağlar.
 * Next.js 15.2.4 ile uyumlu olacak şekilde tasarlanmıştır.
 * 
 * ÖNEMLİ: Bu modül YALNIZCA istemci tarafında çalışır (browser tarafında).
 * Server tarafında import edildiğinde otomatik olarak boş mock fonksiyonlar döndürür.
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase, Database } from "firebase/database";

// Firebase yapılandırma bilgileri - Vercel çevre değişkenleri kullanılarak
const firebaseConfig = (() => {
  try {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
    };
  } catch (error) {
    console.error('❌ Firebase yapılandırma hatası:', error);
    // Çevre değişkenleri ile ilgili sorun yaşandığında sabit değerleri kullan
    return {
      apiKey: "AIzaSyAdAvS2I5ErlCcchaSzOP3225Qd0w1vayI",
      authDomain: "passionis-travel.firebaseapp.com",
      projectId: "passionis-travel",
      databaseURL: "https://passionis-travel-default-rtdb.europe-west1.firebasedatabase.app"
    };
  }
})();

// Firebase App instance
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let rtdb: Database | undefined;
let _initialized = false;
let _initializationAttempts = 0;

/**
 * Firebase'i istemci tarafında başlatmak için güvenli fonksiyon
 * Bu fonksiyon yalnızca tarayıcı ortamında çalışır ve Firebase'i başlatır
 */
// Acil durum yedek Firebase yapılandırması - çevre değişkenleriyle uyumlu
const emergencyConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_FALLBACK_API_KEY || "AIzaSyAdAvS2I5ErlCcchaSzOP3225Qd0w1vayI",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_FALLBACK_PROJECT_ID || "passionis-travel",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_FALLBACK_DATABASE_URL || "https://passionis-travel-default-rtdb.europe-west1.firebasedatabase.app"
};

export function initializeFirebaseClient(): { success: boolean; app?: FirebaseApp; db?: Firestore } {
  try {
    // Tarayıcı ortamında olduğumuzu kontrol et
    if (typeof window === 'undefined') {
      console.warn('❌ Server tarafında Firebase başlatılamaz');
      return { success: false };
    }

    console.log('🔄 Firebase başlatma işlemi başlıyor...');
    
    try {
      // Eğer zaten başarıyla başlatılmışsa, önbelleğe alınan değerleri döndür
      if (_initialized && app && db) {
        console.log('✅ Firebase zaten başarıyla başlatılmış, önbelleğe alınmış instance kullanılıyor');
        return { success: true, app, db };
      }
    } catch (cacheError) {
      console.warn('⚠️ Önbellek kontrolünde hata:', cacheError);
    }

    // Zaten başlatılmış uygulamayı kontrol et
    if (getApps().length > 0) {
      try {
        console.log('🔍 Firebase: Mevcut uygulama bulundu, getApps().length =', getApps().length);
        app = getApps()[0];
        
        // Firebase app'in geçerli olduğunu doğrula
        if (!app || typeof app.name !== 'string') {
          console.error('⚠️ Firebase: Mevcut app geçersiz, yeni oluşturmaya çalışılacak');
          throw new Error('Geçersiz Firebase app instance');
        }
        
        console.log('🔄 Firebase: Mevcut app geçerli, Firestore alınıyor:', app.name);
        db = getFirestore(app);
        
        // Firestore'un geçerli olduğunu kontrol et
        if (!db) {
          console.error('⚠️ Firebase: Firestore alınamadı');
          throw new Error('Firestore instance alınamadı');
        }
        
        _initialized = true;
        console.log('✅ Firebase zaten başlatılmış, mevcut instance başarıyla kullanıldı');
        return { success: true, app, db };
      } catch (appError) {
        console.error('❌ Firebase mevcut instance erişim hatası:', appError);
        // Hata oluşursa yeni bir instance oluşturmayı dene
        _initialized = false; // Başarısız oldu, bu nedenle durumu sıfırla
        app = undefined;
        db = undefined;
      }
    }    // Yeni bir Firebase uygulaması başlat
    try {
      // Mevcut tüm Firebase uygulamalarını temizle
      try {
        const existingApps = getApps();
        console.log(`🔄 Firebase: ${existingApps.length} mevcut uygulama bulundu, sıfırlama kontrol ediliyor`);
        
        // Firebase app'nin zaten oluşturulup oluşturulmadığını kontrol et
        if (existingApps.length === 0) {
          console.log('🔄 Firebase: Yeni bir uygulama oluşturuluyor...');
        }
      } catch (cleanupError) {
        console.warn('⚠️ Firebase: Mevcut uygulamaları kontrol etme hatası:', cleanupError);
      }
      
      _initializationAttempts++;
      console.log(`🔄 Firebase: App başlatılıyor... (Deneme: ${_initializationAttempts})`);
      
      // Firebase yapılandırmasını kontrol et
      if (!firebaseConfig || !firebaseConfig.apiKey) {
        console.error('❌ Firebase: Geçersiz veya eksik yapılandırma');
        return { success: false };
      }
      
      try {
        // Ana yapılandırma ile başlatmayı dene
        app = initializeApp(firebaseConfig);
        console.log('✅ Firebase: App başarıyla başlatıldı:', app.name);
        
        // Firestore'u başlat
        db = getFirestore(app);
        console.log('✅ Firebase: Firestore başarıyla alındı');
        
        // Auth'u başlat
        auth = getAuth(app);
        console.log('✅ Firebase: Auth başarıyla alındı');
        
        // Realtime Database'i başlat
        rtdb = getDatabase(app);
        console.log('✅ Firebase: Database başarıyla alındı');
      } catch (mainError) {
        console.error('❌ Ana yapılandırma ile başlatma başarısız oldu, acil durum yapılandırması deneniyor:', mainError);
        
        // Acil durum yapılandırması ile yeniden dene
        try {
          console.log('🚨 Acil durum yapılandırması ile başlatılıyor...');
          app = initializeApp(emergencyConfig);
          db = getFirestore(app);
          auth = getAuth(app);
          rtdb = getDatabase(app);
          console.log('✅ Acil durum yapılandırması ile Firebase başarıyla başlatıldı');
        } catch (emergencyError) {
          console.error('❌ Acil durum yapılandırması ile başlatma da başarısız oldu:', emergencyError);
          throw emergencyError; // Yeniden fırlat
        }
      }
      
      _initialized = true;
      console.log('✅ Firebase tamamen başlatıldı');
      return { success: true, app, db };
    } catch (initError) {
      console.error('❌ Firebase başlatma hatası:', initError);
      _initialized = false;
      app = undefined;
      db = undefined;
      auth = undefined;
      rtdb = undefined;
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Firebase başlatma işlemi esnasında beklenmeyen hata:', error);
    return { success: false };
  }
}

/**
 * Mevcut Firebase Firestore veritabanına erişim için güvenli fonksiyon
 * Bu fonksiyon, Firestore'a erişim sağlar ve gerekirse Firebase'i otomatik olarak başlatır
 */
export function getDb(): Firestore | undefined {
  // Sunucu tarafında çalıştırılmaya çalışılıyorsa hemen undefined dön
  if (typeof window === 'undefined') {
    console.warn('⚠️ Server tarafında getDb() çağrıldı, undefined dönülüyor');
    return undefined;
  }

  // Eğer db zaten oluşturulmuşsa doğrudan döndür
  if (db) {
    return db;
  }
  
  try {
    console.log('🔄 getDb: Firebase Firestore instance oluşturuluyor...');
    const { success, db: newDb } = initializeFirebaseClient();
    
    if (success && newDb) {
      console.log('✅ getDb: Firebase Firestore instance başarıyla alındı');
      db = newDb;
      return db;
    } else {
      console.error('❌ getDb: Firestore instance oluşturulamadı');
      return undefined;
    }
  } catch (error) {
    console.error('❌ getDb: Firestore erişim hatası:', error);
    return undefined;
  }
}

/**
 * Firebase Auth servisi için erişim fonksiyonu
 */
export function getFirebaseAuth() {
  if (typeof window === 'undefined') return undefined;
  
  try {
    if (auth) return auth;
    
    const { success, app } = initializeFirebaseClient();
    if (success && app) {
      auth = getAuth(app);
      return auth;
    }
    return undefined;
  } catch (error) {
    console.error('❌ Firebase Auth erişim hatası:', error);
    return undefined;
  }
}

/**
 * Firebase Storage servisi için erişim fonksiyonu
 */
export function getFirebaseStorage() {
  if (typeof window === 'undefined') return undefined;
  
  try {
    const { success, app } = initializeFirebaseClient();
    return success && app ? getStorage(app) : undefined;
  } catch (error) {
    console.error('❌ Firebase Storage erişim hatası:', error);
    return undefined;
  }
}

/**
 * Firebase Realtime Database servisi için erişim fonksiyonu
 */
export function getFirebaseDatabase() {
  if (typeof window === 'undefined') return undefined;
  
  try {
    if (rtdb) return rtdb;
    
    const { success, app } = initializeFirebaseClient();
    if (success && app) {
      rtdb = getDatabase(app);
      return rtdb;
    }
    return undefined;
  } catch (error) {
    console.error('❌ Firebase Database erişim hatası:', error);
    return undefined;
  }
}

/**
 * Firebase'in başlatılmış olup olmadığını kontrol eden fonksiyon
 */
export function isFirebaseInitialized(): boolean {
  return _initialized;
}

// Tüm Firebase fonksiyonlarını ve modülleri dışa aktar
export {
  app,
  db,
  auth,
  rtdb
};
