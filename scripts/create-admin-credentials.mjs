// Firebase başlatma test script - ESM version
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAdAvS2I5ErlCcchaSzOP3225Qd0w1vayI",
  authDomain: "passionis-travel.firebaseapp.com",
  projectId: "passionis-travel",
  storageBucket: "passionis-travel.appspot.com",
  messagingSenderId: "1094253004348",
  appId: "1:1094253004348:web:b1a0ec2ed6d8137a2e6539",
  databaseURL: "https://passionis-travel-default-rtdb.europe-west1.firebasedatabase.app" 
};

async function initAdminData() {
  try {
    // Firebase başlat
    console.log("Firebase uygulaması başlatılıyor...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log("Firebase başlatıldı, admin verisi oluşturuluyor...");
    
    // Admin kimlik bilgilerini oluştur
    const docRef = doc(db, "admin", "credentials");
    await setDoc(docRef, {
      username: "admin",
      password: "Passionis123",
      email: "passionistravell@gmail.com",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log("Admin kimlik bilgileri başarıyla oluşturuldu/güncellendi!");
    
    // Bilgileri kontrol et
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("Admin bilgileri:", docSnap.data());
    }
    
    console.log("İşlem tamamlandı!");
  } catch (error) {
    console.error("Hata oluştu:", error);
  }
}

// Fonksiyonu çalıştır
initAdminData();
