// Firebase yapılandırması - basitleştirilmiş sürüm
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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

// Firebase'i başlat
let app;
let db;
let auth;
let storage;
let rtdb;

// Singleton olarak Firebase'i başlat
if (typeof window !== 'undefined') {
  try {
    if (getApps().length === 0) {
      console.log("Firebase'i başlatıyorum...");
      app = initializeApp(firebaseConfig);
    } else {
      console.log("Firebase zaten başlatılmış, mevcut instance kullanılıyor");
      app = getApps()[0];
    }
    
    // Firebase servislerini başlat
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    rtdb = getDatabase(app);
    
    console.log("Firebase servisleri başarıyla başlatıldı");
  } catch (error) {
    console.error("Firebase başlatma hatası:", error);
  }
}

// Client tarafında Firebase'i başlatmak için fonksiyon
export function clientInitializeFirebase() {
  if (typeof window !== 'undefined') {
    try {
      if (!app) {
        console.log("Client tarafında Firebase'i başlatıyorum...");
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app);
        rtdb = getDatabase(app);
      }
      return !!app && !!db;
    } catch (error) {
      console.error("Firebase başlatma hatası:", error);
      return false;
    }
  }
  return false;
}

// Firebase servislerini dışa aktar
export { app, db, auth, storage, rtdb };