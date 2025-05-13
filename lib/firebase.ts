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
    if (!firebaseConfig.apiKey) {
      throw new Error('Firebase API anahtarı eksik! Lütfen yapılandırmayı kontrol edin.');
    }
    
    // Eğer zaten başlatılmışsa, mevcut olanı kullan
    if (getApps().length === 0) {
      console.log("Firebase uygulaması başlatılıyor...");
      app = initializeApp(firebaseConfig);
    } else {
      console.log("Firebase zaten başlatılmış, mevcut instance kullanılıyor");
      app = getApps()[0];
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
  if (typeof window !== "undefined") {
    console.log("Client tarafında Firebase başlatılıyor...");
    const success = initFirebase();
    console.log("Firebase client başlatma sonucu:", success ? "Başarılı" : "Başarısız");
    return success;
  }
  return false;
}