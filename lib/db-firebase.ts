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
    const currentSettings = await getSettings();
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      id: "general",
      updatedAt: serverTimestamp()
    };
    
    // Firestore'a kaydet
    await updateData(COLLECTIONS.settings, updatedSettings);
  } catch (error) {
    console.error("Ayarlar kaydedilirken hata:", error);
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

// Tur şablonlarını kaydet
export const saveTourTemplates = async (tourTemplates: any[]): Promise<void> => {
  try {
    await clearCollection(COLLECTIONS.tourTemplates);
    await bulkSaveData(COLLECTIONS.tourTemplates, tourTemplates);
  } catch (error) {
    console.error("Tur şablonları kaydedilirken hata:", error);
    throw error;
  }
};

// Tüm tur şablonlarını getir
export const getTourTemplates = async (): Promise<any[]> => {
  return getAllData(COLLECTIONS.tourTemplates);
};

// Tek bir tur şablonu getir
export const getTourTemplate = async (id: string): Promise<any> => {
  return getDataById(COLLECTIONS.tourTemplates, id);
};

// Destinasyona ait tur şablonlarını getir
export const getTourTemplatesByDestination = async (destinationId: string): Promise<any[]> => {
  try {
    if (!destinationId) return [];
    
    const colRef = collection(db, COLLECTIONS.tourTemplates);
    const q = query(colRef, where("destinationId", "==", destinationId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
  } catch (error) {
    console.error(`Destinasyon (${destinationId}) için turlar alınırken hata:`, error);
    return [];
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