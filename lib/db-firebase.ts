// Firebase ile merkezi veritabanı işlemleri
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  query,
  where,
  Firestore,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';

// Firebase yapılandırma bilgileri
// Çevre değişkenleri yüklenemediyse varsayılan bir Firebase projesine bağlanacak şekilde düzenlendi
// NOT: Bu değerler gerçek bir Firebase projesine ait olmalıdır
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDWKJTgx6RqQrLJGzSELXd4wSJKmbpWJeQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "muhasebe-passionis.firebaseapp.com", 
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "muhasebe-passionis",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "muhasebe-passionis.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "568891475302",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:568891475302:web:fa97da8217c21fa100caa8",
};

// Veri türlerini tanımlayalım
interface DataItem {
  id: string;
  [key: string]: any;
}

// Firebase uygulamasını başlat - hata yakalama eklenmiş
let app: FirebaseApp;
let db: Firestore | null = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase bağlantısı başarıyla kuruldu");
} catch (error) {
  console.error("Firebase bağlantı hatası:", error);
  // Uygulama tamamen çökmesin diye varsayılan değerlerle devam etmeye çalışalım
  try {
    // Test config ile tekrar deneyelim
    const testConfig = {
      apiKey: "AIzaSyDWKJTgx6RqQrLJGzSELXd4wSJKmbpWJeQ",
      authDomain: "muhasebe-passionis.firebaseapp.com", 
      projectId: "muhasebe-passionis",
      storageBucket: "muhasebe-passionis.appspot.com",
      messagingSenderId: "568891475302",
      appId: "1:568891475302:web:fa97da8217c21fa100caa8",
    };
    app = initializeApp(testConfig);
    db = getFirestore(app);
    console.log("Firebase test bağlantısı kuruldu");
  } catch (fallbackError) {
    console.error("Firebase bağlantısı tamamen başarısız:", fallbackError);
    // Firebase yerine yerel depolamayı kullanan mock bir db objesi oluşturabiliriz
    // Şu an için sadece hata durumunu logluyoruz
  }
}

// Veriyi Firebase'e kaydetme
export const saveToFirebase = async (collectionName: string, data: any, id?: string): Promise<any> => {
  try {
    if (!db) {
      throw new Error("Firebase bağlantısı kurulamadı");
    }

    if (id) {
      // ID belirtildiyse, belirli bir dokümanı güncelle
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
      return { ...data, id };
    } else {
      // Yeni doküman oluştur
      const dataWithTimestamp = { 
        ...data, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, dataWithTimestamp);
      return { ...dataWithTimestamp, id: docRef.id };
    }
  } catch (error) {
    console.error(`Firebase kaydetme hatası (${collectionName}):`, error);
    
    // Firebase başarısız olursa localStorage'a kaydedelim (fallback mekanizması)
    try {
      const key = `local_${collectionName}`;
      const existingData = localStorage.getItem(key);
      let allItems: DataItem[] = [];
      
      if (existingData) {
        allItems = JSON.parse(existingData);
      }
      
      const localData: DataItem = {
        ...data,
        id: id || `local_${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      
      // ID varsa güncelle, yoksa ekle
      if (id) {
        allItems = allItems.map((item: DataItem) => item.id === id ? localData : item);
      } else {
        localData.createdAt = new Date().toISOString();
        allItems.push(localData);
      }
      
      localStorage.setItem(key, JSON.stringify(allItems));
      console.log(`Veri localStorage'a kaydedildi (${collectionName})`);
      
      return localData;
    } catch (localError) {
      console.error(`localStorage kaydetme hatası (${collectionName}):`, localError);
      throw error; // Orijinal hatayı yine de fırlat
    }
  }
};

// Firebase'den tüm koleksiyon verilerini getirme
export const getFromFirebase = async (collectionName: string): Promise<any[]> => {
  try {
    if (!db) {
      throw new Error("Firebase bağlantısı kurulamadı");
    }

    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Firebase veri alma hatası (${collectionName}):`, error);
    
    // Firebase başarısız olursa localStorage'dan okuyalım
    try {
      const key = `local_${collectionName}`;
      const localData = localStorage.getItem(key);
      
      if (localData) {
        const parsedData = JSON.parse(localData);
        console.log(`Veri localStorage'dan yüklendi (${collectionName})`);
        return parsedData;
      }
      
      // Eğer localStorage'da da yoksa, örnek veriler dönebiliriz
      // Bu örnekte boş dizi dönüyoruz, ancak gerekirse örnek veriler de eklenebilir
      return [];
    } catch (localError) {
      console.error(`localStorage okuma hatası (${collectionName}):`, localError);
      return []; // Boş dizi dön
    }
  }
};

// Firebase'den belirli bir dokümanı getirme
export const getDocFromFirebase = async (collectionName: string, id: string): Promise<any> => {
  try {
    if (!db) {
      throw new Error("Firebase bağlantısı kurulamadı");
    }

    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      // Önce hatayı fırlatmak yerine localStorage'a bakalım
      throw new Error(`${collectionName} koleksiyonunda ${id} ID'li doküman bulunamadı`);
    }
  } catch (error) {
    console.error(`Firebase doküman alma hatası (${collectionName}, ${id}):`, error);
    
    // LocalStorage'dan veri okuma deneyelim
    try {
      const key = `local_${collectionName}`;
      const localData = localStorage.getItem(key);
      
      if (localData) {
        const parsedData: DataItem[] = JSON.parse(localData);
        const item = parsedData.find((item: DataItem) => item.id === id);
        
        if (item) {
          console.log(`Doküman localStorage'dan yüklendi (${collectionName}, ${id})`);
          return item;
        }
      }
      
      throw error; // Bulunamadı hatası
    } catch (localError) {
      console.error(`localStorage doküman okuma hatası (${collectionName}, ${id}):`, localError);
      throw error; // Orijinal hatayı fırlat
    }
  }
};

// Firebase'den veri silme
export const deleteFromFirebase = async (collectionName: string, id: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error("Firebase bağlantısı kurulamadı");
    }

    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Firebase silme hatası (${collectionName}, ${id}):`, error);
    
    // Firebase başarısız olursa localStorage'dan silelim
    try {
      const key = `local_${collectionName}`;
      const localData = localStorage.getItem(key);
      
      if (localData) {
        const parsedData: DataItem[] = JSON.parse(localData);
        const filteredData = parsedData.filter((item: DataItem) => item.id !== id);
        localStorage.setItem(key, JSON.stringify(filteredData));
        console.log(`Doküman localStorage'dan silindi (${collectionName}, ${id})`);
      }
    } catch (localError) {
      console.error(`localStorage silme hatası (${collectionName}, ${id}):`, localError);
      throw error; // Orijinal hatayı yine de fırlat
    }
  }
};

// Firebase'de veri güncelleme
export const updateInFirebase = async (collectionName: string, id: string, data: any): Promise<any> => {
  try {
    if (!db) {
      throw new Error("Firebase bağlantısı kurulamadı");
    }

    const docRef = doc(db, collectionName, id);
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  } catch (error) {
    console.error(`Firebase güncelleme hatası (${collectionName}, ${id}):`, error);
    
    // Firebase başarısız olursa localStorage'da güncelleyelim
    try {
      const key = `local_${collectionName}`;
      const localData = localStorage.getItem(key);
      
      if (localData) {
        const parsedData: DataItem[] = JSON.parse(localData);
        const updatedData = parsedData.map((item: DataItem) => {
          if (item.id === id) {
            return { ...item, ...data, updatedAt: new Date().toISOString() };
          }
          return item;
        });
        
        localStorage.setItem(key, JSON.stringify(updatedData));
        console.log(`Doküman localStorage'da güncellendi (${collectionName}, ${id})`);
        
        return { id, ...data, updatedAt: new Date().toISOString() };
      }
      
      throw error; // Belge bulunamadı
    } catch (localError) {
      console.error(`localStorage güncelleme hatası (${collectionName}, ${id}):`, localError);
      throw error; // Orijinal hatayı yine de fırlat
    }
  }
};

// Belirli bir alanın değerine göre sorgu yapma
export const queryFirebase = async (collectionName: string, field: string, value: any): Promise<any[]> => {
  try {
    if (!db) {
      throw new Error("Firebase bağlantısı kurulamadı");
    }

    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, where(field, "==", value));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Firebase sorgu hatası (${collectionName}, ${field}=${value}):`, error);
    
    // Firebase başarısız olursa localStorage'da sorgulayalım
    try {
      const key = `local_${collectionName}`;
      const localData = localStorage.getItem(key);
      
      if (localData) {
        const parsedData: DataItem[] = JSON.parse(localData);
        const filteredData = parsedData.filter((item: DataItem) => item[field] === value);
        console.log(`Sorgu localStorage'da yapıldı (${collectionName}, ${field}=${value})`);
        return filteredData;
      }
      
      return []; // Veri bulunamadı
    } catch (localError) {
      console.error(`localStorage sorgu hatası (${collectionName}, ${field}=${value}):`, localError);
      return []; // Boş dizi dön
    }
  }
};

// IndexedDB yerine Firebase kullanan yardımcı fonksiyonlar
export const saveDataToFirebase = async (storeName: string, data: any[], clearExisting = true): Promise<void> => {
  try {
    if (!db) {
      throw new Error("Firebase bağlantısı kurulamadı");
    }

    // Eğer mevcut verileri temizlememiz gerekiyorsa
    if (clearExisting) {
      // Tüm verileri al ve sil
      const allDocs = await getFromFirebase(storeName);
      for (const doc of allDocs) {
        await deleteFromFirebase(storeName, doc.id);
      }
    }
    
    // Yeni verileri ekle
    for (const item of data) {
      await saveToFirebase(storeName, item, item.id);
    }
  } catch (error) {
    console.error(`Firebase toplu veri kaydetme hatası (${storeName}):`, error);
    
    // Firebase başarısız olursa localStorage'a kaydedelim
    try {
      if (clearExisting) {
        localStorage.setItem(`local_${storeName}`, JSON.stringify(data));
        console.log(`Veriler localStorage'a toplu kaydedildi (${storeName})`);
      } else {
        // Mevcut verilere ekle
        const existingData = localStorage.getItem(`local_${storeName}`);
        let combinedData = [...data];
        
        if (existingData) {
          const parsedExisting: DataItem[] = JSON.parse(existingData);
          // ID'lere göre mevcut verileri güncelle veya yeni veriler ekle
          combinedData = data.map(newItem => {
            const existingItem = parsedExisting.find((item: DataItem) => item.id === newItem.id);
            return existingItem ? { ...existingItem, ...newItem } : newItem;
          });
          
          // Yeni verilerde olmayan mevcut verileri ekle
          parsedExisting.forEach((existingItem: DataItem) => {
            if (!combinedData.some(item => item.id === existingItem.id)) {
              combinedData.push(existingItem);
            }
          });
        }
        
        localStorage.setItem(`local_${storeName}`, JSON.stringify(combinedData));
        console.log(`Veriler localStorage'a eklenerek kaydedildi (${storeName})`);
      }
    } catch (localError) {
      console.error(`localStorage toplu kaydetme hatası (${storeName}):`, localError);
      throw error; // Orijinal hatayı yine de fırlat
    }
  }
};

// Firebase ile kullanılabilecek destinasyon ve aktivite fonksiyonları
export const saveDestinationsToFirebase = async (destinations: any[]): Promise<void> => {
  await saveDataToFirebase("destinations", destinations);
  
  // Ayrıca localStorage'a da kaydet (fallback)
  try {
    localStorage.setItem("destinations", JSON.stringify(destinations));
  } catch (e) {
    console.error("Destinasyonlar localStorage'a kaydedilemedi", e);
  }
};

export const getDestinationsFromFirebase = async (): Promise<any[]> => {
  try {
    // Önce Firebase'den yüklemeyi dene
    const destinations = await getFromFirebase("destinations");
    
    // Başarılı olursa localStorage'a da kaydet (önbellek)
    try {
      localStorage.setItem("destinations", JSON.stringify(destinations));
    } catch (e) {
      console.error("Destinasyonlar localStorage'a kaydedilemedi", e);
    }
    
    return destinations;
  } catch (error) {
    console.error("Destinasyonlar Firebase'den yüklenemedi", error);
    
    // Firebase başarısız olursa localStorage'dan okuma deneyelim
    try {
      const localData = localStorage.getItem("destinations");
      if (localData) {
        return JSON.parse(localData);
      }
      
      // Hiçbir yerden yüklenemezse varsayılan değerler
      const defaultDestinations = [
        { id: "default-dest-1", name: "Antalya", country: "Türkiye", description: "Güzel sahiller" },
        { id: "default-dest-2", name: "İstanbul", country: "Türkiye", description: "Tarihi yarımada" },
        { id: "default-dest-3", name: "Kapadokya", country: "Türkiye", description: "Peri bacaları" }
      ];
      
      // Varsayılan değerleri localStorage'a da kaydedelim
      localStorage.setItem("destinations", JSON.stringify(defaultDestinations));
      return defaultDestinations;
    } catch (localError) {
      console.error("Destinasyonlar localStorage'dan da yüklenemedi", localError);
      return [];
    }
  }
};

export const saveActivitiesToFirebase = async (activities: any[]): Promise<void> => {
  await saveDataToFirebase("activities", activities);
  
  // Ayrıca localStorage'a da kaydet (fallback)
  try {
    localStorage.setItem("activities", JSON.stringify(activities));
  } catch (e) {
    console.error("Aktiviteler localStorage'a kaydedilemedi", e);
  }
};

export const getActivitiesFromFirebase = async (): Promise<any[]> => {
  try {
    // Önce Firebase'den yüklemeyi dene
    const activities = await getFromFirebase("activities");
    
    // Başarılı olursa localStorage'a da kaydet (önbellek)
    try {
      localStorage.setItem("activities", JSON.stringify(activities));
    } catch (e) {
      console.error("Aktiviteler localStorage'a kaydedilemedi", e);
    }
    
    return activities;
  } catch (error) {
    console.error("Aktiviteler Firebase'den yüklenemedi", error);
    
    // Firebase başarısız olursa localStorage'dan okuma deneyelim
    try {
      const localData = localStorage.getItem("activities");
      if (localData) {
        return JSON.parse(localData);
      }
      
      // Hiçbir yerden yüklenemezse varsayılan değerler
      const defaultActivities = [
        { id: "default-act-1", name: "Tekne Turu", destinationId: "default-dest-1", price: "300", currency: "TRY", description: "Güzel bir tekne turu", defaultDuration: "3 saat" },
        { id: "default-act-2", name: "Müze Gezisi", destinationId: "default-dest-2", price: "150", currency: "TRY", description: "Tarihi müze gezisi", defaultDuration: "2 saat" },
        { id: "default-act-3", name: "Balon Turu", destinationId: "default-dest-3", price: "2000", currency: "TRY", description: "Kapadokya'da balon turu", defaultDuration: "1 saat" }
      ];
      
      // Varsayılan değerleri localStorage'a da kaydedelim
      localStorage.setItem("activities", JSON.stringify(defaultActivities));
      return defaultActivities;
    } catch (localError) {
      console.error("Aktiviteler localStorage'dan da yüklenemedi", localError);
      return [];
    }
  }
};

export const saveToursToFirebase = async (tours: any[]): Promise<void> => {
  await saveDataToFirebase("tours", tours);
};

export const getToursFromFirebase = async (): Promise<any[]> => {
  return await getFromFirebase("tours");
};

export const saveFinancialsToFirebase = async (financials: any[]): Promise<void> => {
  await saveDataToFirebase("financials", financials);
};

export const getFinancialsFromFirebase = async (): Promise<any[]> => {
  return await getFromFirebase("financials");
};

export const saveCustomersToFirebase = async (customers: any[]): Promise<void> => {
  await saveDataToFirebase("customers", customers);
};

export const getCustomersFromFirebase = async (): Promise<any[]> => {
  return await getFromFirebase("customers");
};