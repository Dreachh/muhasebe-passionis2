'use client';

/**
 * firebase-direct.ts
 * 
 * Bu dosya firebase-client-module.ts dosyasından yönlendirme sağlayan bir adaptör modüldür.
 * Geriye dönük uyumluluk için muhafaza edilmiştir.
 * 
 * ÖNEMLİ: Yeni kod firebase-client-module.ts dosyasını doğrudan kullanmalıdır.
 */

// Firebase client module'ü import et
import { 
  initializeFirebaseClient,
  getDb,
  getFirebaseAuth,
  getFirebaseStorage,
  getFirebaseDatabase,
  isFirebaseInitialized
} from "./firebase-client-module";

// Re-export firebase client module (yönlendirme)
export {
  initializeFirebaseClient,
  getDb,
  getFirebaseAuth,
  getFirebaseStorage,
  getFirebaseDatabase,
  isFirebaseInitialized
};

// Eski fonksiyonlar için geriye dönük uyumluluk
export function ensureFirestore(): boolean {
  return initializeFirebaseClient().success;
}
