// IndexedDB işlemleri için yardımcı fonksiyonlar
const DB_NAME = "passionistravelDB"
const DB_VERSION = 1

// Store konfigürasyonu için arayüz tanımlaması
interface StoreConfig {
  keyPath: string;
  indexes?: string[];
}

// Store'ların koleksiyonu için arayüz tanımlaması
interface StoreCollection {
  [key: string]: StoreConfig;
}

// Veritabanı şeması
const STORES: StoreCollection = {
  tours: { keyPath: "id", indexes: ["customerName", "tourDate"] },
  financials: { keyPath: "id", indexes: ["date", "type"] },
  customers: { keyPath: "id", indexes: ["name", "phone"] },
  settings: { keyPath: "id" },
  expenses: { keyPath: "id", indexes: ["type", "name"] },
  providers: { keyPath: "id", indexes: ["name"] },
  activities: { keyPath: "id", indexes: ["name"] },
  destinations: { keyPath: "id", indexes: ["name", "country"] },
  ai_conversations: { keyPath: "id", indexes: ["timestamp"] },
  customer_notes: { keyPath: "id", indexes: ["customerId", "timestamp"] },
  referral_sources: { keyPath: "id", indexes: ["name", "type"] },
}

// Veritabanını başlat
export const initializeDB = async (): Promise<void> => {
  try {
    await openDB()
    console.log("Veritabanı başarıyla başlatıldı.")
  } catch (error) {
    console.error("Veritabanı başlatılırken hata:", error)
    throw error
  }
}

// IndexedDB veritabanını aç
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      reject("Veritabanı açılırken hata oluştu: " + request.error)
    }

    request.onsuccess = (event) => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = request.result

      // Veri depolarını oluştur
      Object.entries(STORES).forEach(([storeName, storeConfig]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: storeConfig.keyPath })

          // İndeksleri oluştur
          if (storeConfig.indexes) {
            storeConfig.indexes.forEach((indexName) => {
              store.createIndex(indexName, indexName, { unique: false })
            })
          }
        }
      })
    }
  })
}

// Veri ekle
export const addData = async (storeName: string, data: any): Promise<any> => {
  try {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onsuccess = () => {
        resolve(data)
      }

      request.onerror = () => {
        reject("Veri eklenirken hata oluştu: " + request.error)
      }
    })
  } catch (error) {
    console.error(`Veri ekleme hatası (${storeName}):`, error)
    throw error
  }
}

// Veri güncelle
export const updateData = async (storeName: string, data: any): Promise<any> => {
  try {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => {
        resolve(data)
      }

      request.onerror = () => {
        reject("Veri güncellenirken hata oluştu: " + request.error)
      }
    })
  } catch (error) {
    console.error(`Veri güncelleme hatası (${storeName}):`, error)
    throw error
  }
}

// Veri sil
export const deleteData = async (storeName: string, id: string): Promise<void> => {
  try {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject("Veri silinirken hata oluştu: " + request.error)
      }
    })
  } catch (error) {
    console.error(`Veri silme hatası (${storeName}):`, error)
    throw error
  }
}

// Tüm verileri getir
export const getAllData = async (storeName: string): Promise<any[]> => {
  try {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject("Veriler alınırken hata oluştu: " + request.error)
      }
    })
  } catch (error) {
    console.error(`Veri alma hatası (${storeName}):`, error)
    throw error
  }
}

// ID ile veri getir
export const getDataById = async (storeName: string, id: string): Promise<any> => {
  try {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject("Veri alınırken hata oluştu: " + request.error)
      }
    })
  } catch (error) {
    console.error(`ID ile veri alma hatası (${storeName}):`, error)
    throw error
  }
}

// Veritabanını temizle
export const clearStore = async (storeName: string): Promise<void> => {
  try {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject("Veri deposu temizlenirken hata oluştu: " + request.error)
      }
    })
  } catch (error) {
    console.error(`Veri deposu temizleme hatası (${storeName}):`, error)
    throw error
  }
}

// Local Storage'dan verileri yükle (fallback olarak)
const loadFromLocalStorage = (key: string): any[] => {
  if (typeof localStorage !== "undefined") {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  }
  return []
}

// Local Storage'a verileri kaydet (yedekleme olarak)
const saveToLocalStorage = (key: string, data: any[]): void => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data))
  }
}

// Ayarları getir
export const getSettings = async (): Promise<any> => {
  try {
    const settings = await getDataById("settings", "app-settings")
    return settings || {}
  } catch (error) {
    console.error("Ayarlar alınırken hata:", error)
    // LocalStorage'dan almayı dene
    const settings = typeof localStorage !== "undefined" ? localStorage.getItem("settings") : null
    return settings ? JSON.parse(settings) : {}
  }
}

// Ayarları kaydet
export const saveSettings = async (settings: any): Promise<any> => {
  settings.id = "app-settings" // Sabit bir ID kullan
  
  try {
    // LocalStorage'a da kaydet
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("settings", JSON.stringify(settings))
    }
    
    return await updateData("settings", settings)
  } catch (error) {
    console.error("Ayarlar kaydedilirken hata:", error)
    try {
      return await addData("settings", settings)
    } catch (innerError) {
      console.error("Ayarlar eklenirken hata:", innerError)
      throw innerError
    }
  }
}

// Gider türlerini kaydet
export const saveExpenseTypes = async (expenses: any[]): Promise<void> => {
  try {
    // Önce mevcut gider türlerini temizle
    await clearStore("expenses")
    
    // Yeni gider türlerini ekle
    for (const expense of expenses) {
      await addData("expenses", expense)
    }
    
    // LocalStorage'a da kaydet
    saveToLocalStorage("expenses", expenses)
  } catch (error) {
    console.error("Gider türleri kaydedilirken hata:", error)
    throw error
  }
}

// Gider türlerini getir
export const getExpenseTypes = async (type?: string): Promise<any[]> => {
  try {
    const expenses = await getAllData("expenses")
    
    // Eğer tip belirtilmişse, filtreleme yap
    if (type) {
      return expenses.filter(expense => expense.type === type)
    }
    
    return expenses
  } catch (error) {
    console.error("Gider türleri alınırken hata:", error)
    // LocalStorage'dan almayı dene
    const expenses = loadFromLocalStorage("expenses")
    
    // Eğer tip belirtilmişse, filtreleme yap
    if (type && expenses.length > 0) {
      return expenses.filter((expense: any) => expense.type === type)
    }
    
    return expenses
  }
}

// Sağlayıcıları kaydet
export const saveProviders = async (providers: any[]): Promise<void> => {
  try {
    // Önce mevcut sağlayıcıları temizle
    await clearStore("providers")
    
    // Yeni sağlayıcıları ekle
    for (const provider of providers) {
      await addData("providers", provider)
    }
    
    // LocalStorage'a da kaydet
    saveToLocalStorage("providers", providers)
  } catch (error) {
    console.error("Sağlayıcılar kaydedilirken hata:", error)
    throw error
  }
}

// Sağlayıcıları getir
export const getProviders = async (): Promise<any[]> => {
  try {
    const providers = await getAllData("providers")
    return providers
  } catch (error) {
    console.error("Sağlayıcılar alınırken hata:", error)
    // LocalStorage'dan almayı dene
    return loadFromLocalStorage("providers")
  }
}

// Aktiviteleri kaydet
export const saveActivities = async (activities: any[]): Promise<void> => {
  try {
    // Önce mevcut aktiviteleri temizle
    await clearStore("activities")
    
    // Yeni aktiviteleri ekle
    for (const activity of activities) {
      await addData("activities", activity)
    }
    
    // LocalStorage'a da kaydet
    saveToLocalStorage("activities", activities)
  } catch (error) {
    console.error("Aktiviteler kaydedilirken hata:", error)
    throw error
  }
}

// Aktiviteleri getir
export const getActivities = async (): Promise<any[]> => {
  try {
    const activities = await getAllData("activities")
    return activities
  } catch (error) {
    console.error("Aktiviteler alınırken hata:", error)
    // LocalStorage'dan almayı dene
    return loadFromLocalStorage("activities")
  }
}

// Destinasyonları kaydet
export const saveDestinations = async (destinations: any[]): Promise<void> => {
  try {
    // Önce mevcut destinasyonları temizle
    await clearStore("destinations")
    
    // Yeni destinasyonları ekle
    for (const destination of destinations) {
      await addData("destinations", destination)
    }
    
    // LocalStorage'a da kaydet
    saveToLocalStorage("destinations", destinations)
  } catch (error) {
    console.error("Destinasyonlar kaydedilirken hata:", error)
    throw error
  }
}

// Destinasyonları getir
export const getDestinations = async (): Promise<any[]> => {
  try {
    const destinations = await getAllData("destinations")
    return destinations
  } catch (error) {
    console.error("Destinasyonlar alınırken hata:", error)
    // LocalStorage'dan almayı dene
    return loadFromLocalStorage("destinations")
  }
}

// Simple UUID generator function to replace the uuid package
export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
