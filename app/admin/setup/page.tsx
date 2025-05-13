'use client';

// Admin kimlik bilgilerini Firebase'e eklemek için bir script
import { doc, setDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";

// Firebase konfigürasyon bilgileri
const firebaseConfig = {
  apiKey: "AIzaSyAdAvS2I5ErlCcchaSzOP3225Qd0w1vayI",
  authDomain: "passionis-travel.firebaseapp.com",
  projectId: "passionis-travel",
  storageBucket: "passionis-travel.appspot.com",
  messagingSenderId: "1094253004348",
  appId: "1:1094253004348:web:b1a0ec2ed6d8137a2e6539"
};

// Admin bilgilerini Firebase'e ekleyen bileşen
export default function AdminDataSetup() {
  const setupAdminData = async () => {
    try {
      // Firebase'i başlat
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      
      console.log("Admin kimlik bilgilerini Firestore'a ekliyorum...");
      
      // Admin kimlik bilgilerini ekle
      const docRef = doc(db, "admin", "credentials");
      await setDoc(docRef, {
        username: "admin",
        password: "Passionis123",
        email: "passionistravell@gmail.com",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log("Admin kimlik bilgileri başarıyla eklendi!");
      alert("Admin kimlik bilgileri başarıyla eklendi! Şimdi giriş yapabilirsiniz.");
    } catch (error) {
      console.error("Admin kimlik bilgileri eklenirken hata:", error);
      alert("Hata: " + error.message);
    }
  };
  
  return (
    <div className="flex min-h-screen w-full items-center justify-center flex-col">
      <h1 className="text-2xl font-bold mb-4">Admin Kimlik Bilgilerini Oluştur</h1>
      <p className="mb-4 text-gray-600 max-w-md text-center">
        Bu sayfa, admin giriş bilgilerini Firebase'e eklemek için kullanılır. 
        Sadece ilk kurulumda bir kez çalıştırmanız gerekir.
      </p>
      <button
        onClick={setupAdminData}
        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
      >
        Admin Bilgilerini Oluştur
      </button>
      <p className="mt-8 text-sm text-gray-500">
        <strong>Varsayılan Bilgiler:</strong><br/>
        Kullanıcı adı: admin<br/>
        Şifre: Passionis123<br/>
        E-posta: passionistravell@gmail.com
      </p>
    </div>
  );
}
