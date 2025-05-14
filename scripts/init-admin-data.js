// Firebase Admin verilerini oluşturmak için script
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = require('firebase/firestore');

// Firebase yapılandırma bilgileri doğrudan tanımlanıyor
// NOT: Bu script için yapılandırmayı doğrudan burada saklıyoruz, güvenli kullanım için .env dosyası kullanın
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
    console.log('Firebase admin verisi kontrol ediliyor...');
    
    // Firebase başlat
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Önce mevcut admin bilgilerini kontrol et
    const docRef = doc(db, "admin", "credentials");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('Admin kimlik bilgileri zaten mevcut, güncelleme yapılacak...');
      
      // Mevcut verileri al
      const existingData = docSnap.data();
      console.log('Mevcut bilgiler:', {
        username: existingData.username,
        email: existingData.email,
        createdAt: existingData.createdAt?.toDate?.() || 'tarih alınamadı'
      });
      
      // Admin bilgilerini güncelle
      await setDoc(doc(db, "admin", "credentials"), {
        ...existingData,  // Mevcut verileri koru
        username: "admin", // Güncellenecek kullanıcı adı
        password: "Passionis123", // Güncellenecek şifre
        email: "passionistravell@gmail.com", // Güncellenecek e-posta
        updatedAt: new Date() // Güncelleme zamanını ayarla
      });
      
      console.log('Firebase admin verisi başarıyla güncellendi!');
    } else {
      console.log('Admin kimlik bilgileri bulunamadı, yeni kayıt oluşturuluyor...');
      
      // Admin bilgilerini oluştur
      await setDoc(doc(db, "admin", "credentials"), {
        username: "admin", // Varsayılan kullanıcı adı
        password: "Passionis123", // Varsayılan şifre
        email: "passionistravell@gmail.com", // Admin e-posta adresi
        createdAt: new Date(), // Oluşturma zamanı
        updatedAt: new Date() // Güncelleme zamanı
      });
      
      console.log('Firebase admin verisi başarıyla oluşturuldu!');
    }
  } catch (error) {
    console.error('Firebase admin verisi işlem hatası:', error);
  }
}

// Scripti çalıştır
initializeAdminData().then(() => console.log('İşlem tamamlandı.'));
