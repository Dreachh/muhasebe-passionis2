"use client";

// Firebase yapılandırması
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase, Database } from "firebase/database";

// Firebase yapılandırma bilgileri
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAdAvS2I5ErlCcchaSzOP3225Qd0w1vayI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "passionis-travel.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "passionis-travel",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "passionis-travel.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1094253004348",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1094253004348:web:b1a0ec2ed6d8137a2e6539",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://passionis-travel-default-rtdb.europe-west1.firebasedatabase.app"
};

// Singleton Firebase servislerini içerecek değişkenler
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: any;
let rtdb: Database;

// Firebase'i başlatmak için güvenli bir fonksiyon
function initFirebase(): boolean {
  try {
    // Browser tarafında olduğumuzu kontrol et
    if (typeof window === 'undefined') {
      console.log('Server tarafında çalışıyor, Firebase başlatma atlanıyor');
      return false;
    }

    if (!firebaseConfig.apiKey) {
      console.error('Firebase API anahtarı eksik! Lütfen yapılandırmayı kontrol edin.');
      return false;
    }
    
    // Eğer zaten başlatılmışsa, mevcut olanı kullan
    if (getApps().length === 0) {
      console.log("Firebase uygulaması başlatılıyor...");
      try {
        app = initializeApp(firebaseConfig);
      } catch (initError) {
        console.error("Firebase başlatma hatası:", initError);
        return false;
      }
    } else {
      console.log("Firebase zaten başlatılmış, mevcut instance kullanılıyor");
      try {
        app = getApps()[0];
      } catch (getAppError) {
        console.error("Firebase instance erişim hatası:", getAppError);
        return false;
      }
    }
    
    // Firebase servislerini başlat
    db = getFirestore(app);
    rtdb = getDatabase(app);
    auth = getAuth(app);
    storage = getStorage(app);
    
    console.log("Firebase servisleri başarıyla başlatıldı");
    return true;
  } catch (error) {
    console.error("Firebase başlatma hatası:", error);
    return false;
  }
}

// Firebase'i başlat
const firebaseInitialized = initFirebase();

// Firebase servislerini dışa aktar
export { app, db, rtdb, auth, storage, firebaseInitialized };

// İstemci tarafında Firebase'i yeniden başlatmak için kullanılacak fonksiyon
export function clientInitializeFirebase(): boolean {
  try {
    if (typeof window !== "undefined") {
      console.log("Client tarafında Firebase başlatılıyor...");
      const success = initFirebase();
      console.log("Firebase client başlatma sonucu:", success ? "Başarılı" : "Başarısız");
      return success;
    }
    console.log("Client tarafında değil, Firebase başlatılmıyor");
    return false;
  } catch (error) {
    console.error("Firebase başlatma hatası (clientInitializeFirebase):", error);
    return false;
  }
}