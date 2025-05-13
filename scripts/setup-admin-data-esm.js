// Admin veri başlatma script'i, ESM formatında - Next.js uyumlu version
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAdAvS2I5ErlCcchaSzOP3225Qd0w1vayI",
  authDomain: "passionis-travel.firebaseapp.com",
  projectId: "passionis-travel",
  storageBucket: "passionis-travel.appspot.com",
  messagingSenderId: "1094253004348",
  appId: "1:1094253004348:web:b1a0ec2ed6d8137a2e6539",
  databaseURL: "https://passionis-travel-default-rtdb.europe-west1.firebasedatabase.app"
};

async function initializeAdminData() {
  try {
    console.log('Firebase admin veri oluşturuluyor...');
    
    // Firebase başlat
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Admin dokümanını oluştur
    const adminData = {
      username: "admin",
      password: "Passionis123",
      email: "passionistravell@gmail.com",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    // Firebase'e yaz
    await setDoc(doc(db, "admin", "credentials"), adminData);
    
    console.log('Admin verileri Firebase\'e başarıyla yazıldı!');
    return true;
  } catch (error) {
    console.error('Admin veri oluşturma hatası:', error);
    return false;
  }
}

// Scripti çalıştır
initializeAdminData()
  .then((result) => {
    if (result) {
      console.log('İşlem başarılı!');
    } else {
      console.log('İşlem başarısız!');
    }
  })
  .catch((error) => {
    console.error('Beklenmeyen hata:', error);
  })
  .finally(() => {
    console.log('İşlem tamamlandı');
    process.exit(0);
  });
