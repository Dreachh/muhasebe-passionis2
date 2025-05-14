// Firebase yapılandırması ve başlatma
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

// Firebase uygulamasını başlatma - client ve server tarafında güvenli
const getFirebaseApp = () => {
  if (getApps().length > 0) {
    // Zaten başlatılmış uygulama varsa onu kullan
    return getApps()[0];
  }
  
  // İlk kez başlatılıyorsa yeni uygulama oluştur
  return initializeApp(firebaseConfig);
};

// Firebase App instance
const app = getFirebaseApp();

// Firebase servisleri
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);

// Firebase servislerini dışa aktar
export { app, db, auth, storage, rtdb };

// Client tarafında Firebase'i başlatmak için
export function initializeClientSide() {
  if (typeof window !== 'undefined') {
    try {
      console.log("Client tarafında Firebase başlatıldı");
      return { app, db, auth, storage, rtdb };
    } catch (error) {
      console.error("Firebase başlatma hatası:", error);
      return null;
    }
  }
  return null;
}
