// Firebase konfigürasyonu ve başlatma
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

// Firebase yapılandırma bilgilerini doğrudan tanımlıyoruz
// NOT: Bu sadece geçici bir çözümdür, ideal olarak çevre değişkenleri kullanılmalıdır
const firebaseConfig = {
  apiKey: "AIzaSyAdAvS2I5ErlCcchaSzOP3225Qd0w1vayI",
  authDomain: "passionis-travel.firebaseapp.com",
  projectId: "passionis-travel",
  storageBucket: "passionis-travel.appspot.com",
  messagingSenderId: "1094253004348",
  appId: "1:1094253004348:web:b1a0ec2ed6d8137a2e6539",
  databaseURL: "https://passionis-travel-default-rtdb.europe-west1.firebasedatabase.app" // Realtime Database URL'i
};

// Singleton Firebase uygulama örneği ve servisleri
let firebaseApp: FirebaseApp;
let firestore: Firestore;
let database: any; // Realtime Database için

// Firebase'i başlat
try {
  // Eğer zaten başlatılmışsa, mevcut olanı kullan
  if (getApps().length === 0) {
    console.log("Firebase uygulaması başlatılıyor...");
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    console.log("Firebase zaten başlatılmış, mevcut instance kullanılıyor");
    firebaseApp = getApps()[0];
  }
  
  // Firebase servislerine erişim
  firestore = getFirestore(firebaseApp);
  database = getDatabase(firebaseApp); // Realtime Database'i başlat
  console.log("Firebase servisleri başarıyla başlatıldı");
} catch (error) {
  console.error("Firebase başlatma hatası:", error);
}

// Firebase servislerini dışa aktar
export const app = firebaseApp;
export const db = firestore;
export const rtdb = database; // Realtime Database'i dışa aktar
export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);

// İstemci tarafında Firebase'i başlatmak için kullanılacak fonksiyon
export function initializeDB(): Firestore {
  if (!firestore) {
    throw new Error("Firestore henüz başlatılmadı");
  }
  return firestore;
}

// Realtime Database'i başlatmak için fonksiyon
export function initializeRTDB(): any {
  if (!database) {
    throw new Error("Realtime Database henüz başlatılmadı");
  }
  return database;
}

// Ana sayfa yüklendiğinde Firebase'i başlatmak için global fonksiyon
export function initializeFirebase() {
  if (typeof window !== "undefined") {
    console.log("initializeFirebase fonksiyonu çağrıldı");
    // Global olarak erişilebilir yap
    (window as any).initializeDB = initializeDB;
    (window as any).initializeRTDB = initializeRTDB;
    return { 
      firestore: initializeDB(), 
      database: initializeRTDB() 
    };
  }
  return null;
}

export default app;