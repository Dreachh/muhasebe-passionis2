// Admin kimlik bilgilerini Firebase'e eklemek için basit bir script
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

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

async function createAdminCredentials() {
  try {
    console.log("Firebase başlatılıyor...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log("Admin kimlik bilgilerini eklemek için Firestore'a bağlanılıyor...");
    
    const adminData = {
      username: "admin",
      password: "Passionis123",
      email: "passionistravell@gmail.com",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log("Admin kimlik bilgileri oluşturuluyor:", adminData);
    
    await setDoc(doc(db, "admin", "credentials"), adminData);
    
    console.log("Admin kimlik bilgileri başarıyla oluşturuldu!");
  } catch (error) {
    console.error("Admin kimlik bilgileri oluşturulurken hata:", error);
  }
}

createAdminCredentials();
