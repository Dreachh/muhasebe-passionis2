// Firebase ile veri işlemleri için yardımcı fonksiyonlar
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getDatabase, ref, set, get } from "firebase/database";

// IndexedDB'deki STORES koleksiyonuna karşılık gelen koleksiyonlar
export const COLLECTIONS = {
  tours: "tours", 
  financials: "financials",
  customers: "customers",
  settings: "settings",
  expenses: "expenses",
  providers: "providers",
  activities: "activities",
  destinations: "destinations",
  ai_conversations: "ai_conversations",
  customer_notes: "customer_notes",
  referral_sources: "referral_sources", 
  tourTemplates: "tourTemplates",
};

// UUID oluşturma fonksiyonu (IndexedDB'den aynısını kullanıyoruz)
export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Veri ekleme
export const addData = async (collectionName: string, data: any): Promise<string> => {
  try {
    // ID özelliğine sahip verilerde setDoc kullan
    if (data.id) {
      const docRef = doc(db, collectionName, data.id);
      await setDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return data.id;
    } 
    // ID özelliği olmayan verilerde addDoc kullan
    else {
      const colRef = collection(db, collectionName);
      const newData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(colRef, newData);
      return docRef.id;
    }
  } catch (error) {
    console.error(`${collectionName} verisini eklerken hata:`, error);
    throw error;
  }
};

// Veri güncelleme
export const updateData = async (collectionName: string, data: any): Promise<any> => {
  try {
    if (!data.id) {
      throw new Error("Güncellenecek verinin id özelliği yok");
    }

    const docRef = doc(db, collectionName, data.id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return data;
  } catch (error) {
    console.error(`${collectionName} verisini güncellerken hata:`, error);
    throw error;
  }
};

// Veri silme
export const deleteData = async (collectionName: string, id: string): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`${collectionName} verisini silerken hata:`, error);
    throw error;
  }
};

// Tüm verileri getir
export const getAllData = async (collectionName: string): Promise<any[]> => {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
  } catch (error) {
    console.error(`${collectionName} verilerini alırken hata:`, error);
    return [];
  }
};

// ID ile veri getir
export const getDataById = async (collectionName: string, id: string): Promise<any> => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log(`${collectionName}/${id} verisi bulunamadı`);
      return null;
    }
  } catch (error) {
    console.error(`${collectionName}/${id} verisini alırken hata:`, error);
    return null;
  }
};

// Veri temizleme
export const clearCollection = async (collectionName: string): Promise<void> => {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`${collectionName} koleksiyonu temizlendi`);
  } catch (error) {
    console.error(`${collectionName} koleksiyonunu temizlerken hata:`, error);
    throw error;
  }
};

// Toplu veri kaydetme (migration için)
export const bulkSaveData = async (collectionName: string, dataList: any[]): Promise<void> => {
  try {
    if (!dataList || dataList.length === 0) {
      console.log(`${collectionName} için boş veri listesi, işlem yapılmadı`);
      return;
    }

    // Batch işlemi maksimum 500 yazma işlemini destekler
    const batchSize = 450;
    let batch = writeBatch(db);
    let operationCount = 0;
    
    for (const data of dataList) {
      // Her veri için ID kontrol et
      const id = data.id || generateUUID();
      const docRef = doc(db, collectionName, id);
      
      batch.set(docRef, {
        ...data,
        id: id, // ID'yi ekleyerek tutarlılığı sağla
        updatedAt: serverTimestamp(),
        migratedAt: serverTimestamp(), // Migration tarihi
      });
      
      operationCount++;
      
      // Batch sınırına ulaşıldığında commit ve yeni batch başlat
      if (operationCount === batchSize) {
        console.log(`${collectionName}: ${operationCount} veri yazılıyor...`);
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }
    }
    
    // Kalan işlemleri commit et
    if (operationCount > 0) {
      console.log(`${collectionName}: Son ${operationCount} veri yazılıyor...`);
      await batch.commit();
    }
    
    console.log(`${collectionName}: Toplam ${dataList.length} veri başarıyla kaydedildi`);
  } catch (error) {
    console.error(`${collectionName} verilerini kaydederken hata:`, error);
    throw error;
  }
};

// IndexedDB verilerini Firestore'a taşıma (migration)
export const migrateToFirestore = async (exportedData: { [key: string]: any[] }): Promise<void> => {
  try {
    for (const [storeName, data] of Object.entries(exportedData)) {
      if (!data || !Array.isArray(data)) {
        console.log(`${storeName} için geçerli veri bulunamadı, atlanıyor...`);
        continue;
      }
      
      const collectionName = COLLECTIONS[storeName as keyof typeof COLLECTIONS] || storeName;
      
      console.log(`--- ${storeName} => ${collectionName} taşınıyor (${data.length} kayıt) ---`);
      
      if (data.length === 0) {
        console.log(`${storeName} boş, atlanıyor...`);
        continue;
      }
      
      await bulkSaveData(collectionName, data);
    }
    
    console.log("Firestore'a veri taşıma işlemi tamamlandı!");
  } catch (error) {
    console.error("Veri taşıma işlemi sırasında hata:", error);
    throw error;
  }
};

// Ayarları getir - IndexedDB uyumlu
export const getSettings = async (): Promise<any> => {
  try {
    // Önce "general" id'li ayarı almaya çalış
    const settings = await getDataById(COLLECTIONS.settings, "general");
    if (settings) return settings;

    // Eğer bulamazsan "app-settings" id'li ayarı dene (eski format için)
    const appSettings = await getDataById(COLLECTIONS.settings, "app-settings");
    if (appSettings) return appSettings;
    
    // Hiçbiri yoksa boş nesne dön
    return {};
  } catch (error) {
    console.error("Ayarlar alınırken hata:", error);
    return {};
  }
};

// Ayarları kaydet - IndexedDB uyumlu
export const saveSettings = async (settings: any): Promise<void> => {
  try {
    // Mevcut ayarları almaya çalış
    let currentSettings = await getDataById(COLLECTIONS.settings, "general");
    
    // Eğer "general" id'li döküman yoksa, yeni bir döküman oluştur
    if (!currentSettings) {
      console.log("Ayarlar dökümanı bulunamadı, yeni döküman oluşturuluyor...");
      
      const newSettings = {
        ...settings,
        id: "general",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Yeni dökümanı ekle
      await addData(COLLECTIONS.settings, newSettings);
      console.log("Yeni ayarlar dökümanı başarıyla oluşturuldu");
      return;
    }
    
    // Mevcut döküman varsa güncelle
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      id: "general",
      updatedAt: serverTimestamp()
    };
    
    // Firestore'a kaydet
    await updateData(COLLECTIONS.settings, updatedSettings);
    console.log("Ayarlar dökümanı başarıyla güncellendi");
  } catch (error) {
    console.error("settings verisini güncellerken hata:", error);
    throw error;
  }
};

// Gider türlerini kaydet
export const saveExpenseTypes = async (expenseTypes: any[]): Promise<void> => {
  try {
    // Önce koleksiyonu temizle
    await clearCollection(COLLECTIONS.expenses);
    
    // Sonra yeni giderleri ekle
    await bulkSaveData(COLLECTIONS.expenses, expenseTypes);
  } catch (error) {
    console.error("Gider türleri kaydedilirken hata:", error);
    throw error;
  }
};

// Gider türlerini getir
export const getExpenseTypes = async (): Promise<any[]> => {
  return getAllData(COLLECTIONS.expenses);
};

// Sağlayıcıları kaydet
export const saveProviders = async (providers: any[]): Promise<void> => {
  try {
    await clearCollection(COLLECTIONS.providers);
    await bulkSaveData(COLLECTIONS.providers, providers);
  } catch (error) {
    console.error("Sağlayıcılar kaydedilirken hata:", error);
    throw error;
  }
};

// Sağlayıcıları getir
export const getProviders = async (): Promise<any[]> => {
  return getAllData(COLLECTIONS.providers);
};

// Aktiviteleri kaydet
export const saveActivities = async (activities: any[]): Promise<void> => {
  try {
    await clearCollection(COLLECTIONS.activities);
    await bulkSaveData(COLLECTIONS.activities, activities);
  } catch (error) {
    console.error("Aktiviteler kaydedilirken hata:", error);
    throw error;
  }
};

// Aktiviteleri getir
export const getActivities = async (): Promise<any[]> => {
  return getAllData(COLLECTIONS.activities);
};

// Destinasyonları kaydet
export const saveDestinations = async (destinations: any[]): Promise<void> => {
  try {
    await clearCollection(COLLECTIONS.destinations);
    await bulkSaveData(COLLECTIONS.destinations, destinations);
  } catch (error) {
    console.error("Destinasyonlar kaydedilirken hata:", error);
    throw error;
  }
};

// Destinasyonları getir
export const getDestinations = async (): Promise<any[]> => {
  return getAllData(COLLECTIONS.destinations);
};

// Referans kaynaklarını kaydet
export const saveReferralSources = async (sources: any[]): Promise<void> => {
  try {
    await clearCollection(COLLECTIONS.referral_sources);
    await bulkSaveData(COLLECTIONS.referral_sources, sources);
  } catch (error) {
    console.error("Referans kaynakları kaydedilirken hata:", error);
    throw error;
  }
};

// Referans kaynaklarını getir
export const getReferralSources = async (): Promise<any[]> => {
  return getAllData(COLLECTIONS.referral_sources);
};

// Tur şablonları için işlevler
export const saveTourTemplates = async (tourTemplates: any[]): Promise<void> => {
  try {
    // rtdb import ediliyor
    const { rtdb } = await import("./firebase");
    const { ref, set, get } = await import("firebase/database");
    
    if (!rtdb) {
      throw new Error("Realtime Database bağlantısı kurulamadı.");
    }
    
    if (!tourTemplates || !Array.isArray(tourTemplates)) {
      console.error("Geçersiz tur şablonları verisi:", tourTemplates);
      throw new Error("Geçersiz tur şablonları verisi");
    }

    // ID'si olmayan şablonlara ID ekle ve tüm verileri doğrula
    const validatedTemplates = tourTemplates.map(template => {
      if (!template.id) {
        console.log('ID eksik şablon tespit edildi, yeni ID ekleniyor');
        return { ...template, id: generateUUID() };
      }
      return template;
    }).filter(Boolean); // null ve undefined değerlerini temizle
    
    console.log(`${validatedTemplates.length} tur şablonu kaydediliyor. İçerik:`, JSON.stringify(validatedTemplates));
    
    // Tüm güncel listeyi doğrudan kaydet - önceki kayıtları birleştirme
    await set(ref(rtdb, 'tourTemplates'), validatedTemplates);
    
    // Yerel depolama yedeklemesi
    try {
      localStorage.setItem('tour_templates_backup', JSON.stringify(validatedTemplates));
      console.log('Yedekleme için tur şablonları localStorage\'a kaydedildi');
    } catch (localErr) {
      console.warn('localStorage yedeklemesi yapılamadı:', localErr);
    }
    
    // Doğrulama ve log
    try {
      const verifySnapshot = await get(ref(rtdb, 'tourTemplates'));
      if (verifySnapshot.exists()) {
        const savedData = verifySnapshot.val();
        
        if (Array.isArray(savedData)) {
          console.log(`Doğrulama başarılı: ${savedData.length} tur şablonu kaydedildi!`);
        } else {
          console.log('Doğrulama uyarısı: Veri dizi formatında değil, ancak kaydedildi');
          console.log('Kaydedilen veri tipi:', typeof savedData);
        }
      } else {
        console.error('Veri kaydedilmiş gibi görünüyor ama doğrulanamadı!');
      }
    } catch (verifyError) {
      console.warn('Doğrulama hatası:', verifyError);
    }
  } catch (error) {
    console.error('Tur şablonları kaydedilirken hata:', error);
    throw error;
  }
};

export const getTourTemplates = async (): Promise<any[]> => {
  try {
    // rtdb import ediliyor
    const { rtdb } = await import("./firebase");
    const { ref, get } = await import("firebase/database");
    
    if (!rtdb) {
      throw new Error("Realtime Database bağlantısı kurulamadı.");
    }
    
    console.log('Tur şablonları getiriliyor...');
    const snapshot = await get(ref(rtdb, 'tourTemplates'));
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Firebase'den gelen veri dizi formunda değilse dönüştür
      if (Array.isArray(data)) {
        // Null değerleri temizle
        const filteredData = data.filter(Boolean);
        console.log(`${filteredData.length} tur şablonu bulundu.`);
        return filteredData;
      } else if (typeof data === 'object' && data !== null) {
        // Obje formunda ise diziye dönüştür
        const objData = Object.values(data).filter(Boolean);
        console.log(`Obje olarak ${objData.length} tur şablonu bulundu.`);
        return objData;
      }
      
      console.log('Veri bulunamadı veya geçersiz format.');
      return [];
    }
    
    console.log('Tur şablonu bulunamadı, localStorage kontrolü yapılıyor...');
    
    // Veritabanında veri yoksa, localStorage'dan kurtarma dene
    try {
      const backupData = localStorage.getItem('tour_templates_backup');
      if (backupData) {
        const parsedData = JSON.parse(backupData);
        console.log('Tur şablonları localStorage\'dan alındı');
        return Array.isArray(parsedData) ? parsedData : [];
      }
    } catch (localStorageError) {
      console.warn('localStorage\'dan veri alınamadı:', localStorageError);
    }
    
    return [];
  } catch (error) {
    console.error('Tur şablonları getirilirken hata:', error);
    
    // Hata durumunda localStorage'dan kurtarma dene
    try {
      const backupData = localStorage.getItem('tour_templates_backup');
      if (backupData) {
        const parsedData = JSON.parse(backupData);
        console.log('Hata sonrası tur şablonları localStorage\'dan kurtarıldı');
        return Array.isArray(parsedData) ? parsedData : [];
      }
    } catch (localStorageError) {
      console.warn('localStorage\'dan veri alınamadı:', localStorageError);
    }
    
    return [];
  }
};

export const getTourTemplatesByDestination = async (destinationId: string): Promise<any[]> => {
  try {
    // Tüm tur şablonlarını getir
    const allTemplates = await getTourTemplates();
    
    // Verilen destinationId'ye göre filtrele
    const filteredTemplates = allTemplates.filter((template) => 
      template.destinationId === destinationId
    );
    
    console.log(`${destinationId} ID'li destinasyona ait ${filteredTemplates.length} tur şablonu bulundu.`);
    return filteredTemplates;
  } catch (error) {
    console.error(`Destinasyon ID: ${destinationId} için tur şablonları getirilirken hata:`, error);
    throw error;
  }
};

// Belirli bir tur şablonunu getir
export const getTourTemplate = async (id: string): Promise<any> => {
  try {
    // Önce tüm şablonları al
    const allTemplates = await getTourTemplates();
    
    // ID'ye göre filtrele
    const template = allTemplates.find(template => template.id === id);
    
    if (template) {
      return template;
    } else {
      console.log(`ID: ${id} olan tur şablonu bulunamadı.`);
      return null;
    }
  } catch (error) {
    console.error(`ID: ${id} olan tur şablonu alınırken hata:`, error);
    throw error;
  }
};

// Turları kaydet
export const saveTours = async (tours: any[]): Promise<void> => {
  try {
    await clearCollection(COLLECTIONS.tours);
    await bulkSaveData(COLLECTIONS.tours, tours);
  } catch (error) {
    console.error("Turlar kaydedilirken hata:", error);
    throw error;
  }
};

// Tüm turları getir
export const getTours = async (): Promise<any[]> => {
  return getAllData(COLLECTIONS.tours);
};