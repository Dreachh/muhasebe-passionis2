// Firebase konfigürasyonu ve başlatma
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase yapılandırma bilgilerini doğrudan tanımlıyoruz
// NOT: Bu sadece geçici bir çözümdür, ideal olarak çevre değişkenleri kullanılmalıdır
const firebaseConfig = {
  apiKey: "AIzaSyAdAvS2I5ErlCcchaSzOP3225Qd0w1vayI",
  authDomain: "passionis-travel.firebaseapp.com",
  projectId: "passionis-travel",
  storageBucket: "passionis-travel.firebasestorage.app",
  messagingSenderId: "1094253004348",
  appId: "1:1094253004348:web:b1a0ec2ed6d8137a2e6539"
};

// Firebase'i başlat (eğer zaten başlatılmamışsa)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase servislerine erişim
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// İstemci tarafında Firebase'i başlatmak için kullanılacak fonksiyon
export function initializeDB() {
  return db;
}

export default app;