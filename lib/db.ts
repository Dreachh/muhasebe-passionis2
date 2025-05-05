// IndexedDB veritabanı işlemleri için yardımcı fonksiyonlar
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
    const db = await openDB()
    console.log("Veritabanı başarıyla başlatıldı:", db.name, "v", db.version)
    db.close()
  } catch (error) {
    console.error("Veritabanı başlatma hatası:", error)
    throw error
  }
}

// Veritabanı bağlantısını aç
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
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    console.log("EKLEME DENEMESİ:", storeName, data?.id, data)
    const request = store.add(data)

    request.onsuccess = () => {
      resolve(data)
    }

    request.onerror = () => {
      reject("Veri eklenirken hata oluştu: " + request.error)
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

// Veri güncelle
export const updateData = async (storeName: string, data: any): Promise<any> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    // KeyPath kontrolü
    const keyPath = store.keyPath || "id";
    if (!data || !data[keyPath]) {
      reject(`updateData: '${storeName}' için '${keyPath}' alanı eksik! Veri: ` + JSON.stringify(data));
      db.close();
      return;
    }
    const request = store.put(data)

    request.onsuccess = () => {
      resolve(data)
    }

    request.onerror = () => {
      reject("Veri güncellenirken hata oluştu: " + request.error)
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

// Veri sil
export const deleteData = async (storeName: string, id: string): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    
    console.log(`Silme işlemi başlıyor: Store=${storeName}, ID=${id}`);
    const request = store.delete(id)

    request.onsuccess = () => {
      console.log(`Veri başarıyla silindi: Store=${storeName}, ID=${id}`);
      resolve()
    }

    request.onerror = () => {
      console.error(`Veri silinirken hata oluştu: Store=${storeName}, ID=${id}, Hata:`, request.error);
      reject("Veri silinirken hata oluştu: " + request.error)
    }

    transaction.oncomplete = () => {
      console.log(`Silme işlemi tamamlandı: Store=${storeName}, ID=${id}`);
      db.close()
    }
  })
}

// Tüm verileri getir
export const getAllData = async (storeName: string): Promise<any[]> => {
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

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

// ID ile veri getir
export const getDataById = async (storeName: string, id: string): Promise<any> => {
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

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

// Veritabanını temizle
export const clearStore = async (storeName: string): Promise<void> => {
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

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

// Ayarları kaydet
export const saveSettings = async (settings: any): Promise<any> => {
  settings.id = "app-settings" // Sabit bir ID kullan
  return updateData("settings", settings)
}

// Ayarları getir
export const getSettings = async (): Promise<any> => {
  try {
    const settings = await getDataById("settings", "app-settings")
    return settings || {} // Ayarlar yoksa boş nesne döndür
  } catch (error) {
    console.error("Ayarlar alınırken hata:", error)
    return {}
  }
}

// Gider türlerini kaydet
export const saveExpenseTypes = async (expenseTypes: any[]): Promise<void> => {
  try {
    // Önce mevcut gider türlerini temizle
    await clearStore("expenses")

    // Sonra yeni gider türlerini ekle
    for (const expenseType of expenseTypes) {
      await addData("expenses", expenseType)
    }
  } catch (error) {
    console.error("Gider türleri kaydedilirken hata:", error)
    throw error
  }
}

// Gider türlerini getir
export const getExpenseTypes = async (type?: string): Promise<any[]> => {
  // Varsayılan gider türleri
  const defaultExpenseTypes = [
    { id: "default-expense-1", type: "accommodation", name: "Konaklama", category: "Tur Giderleri" },
    { id: "default-expense-2", type: "transportation", name: "Ulaşım", category: "Tur Giderleri" },
    { id: "default-expense-3", type: "meal", name: "Yemek", category: "Tur Giderleri" },
    { id: "default-expense-4", type: "guide", name: "Rehber Ücreti", category: "Personel" },
    { id: "default-expense-5", type: "entry", name: "Giriş Ücreti", category: "Tur Giderleri" }
  ];

  try {
    // Önce localStorage'dan kontrol et
    try {
      const cachedData = localStorage.getItem('expenseTypes');
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
            console.log("Gider türleri önbellekten yüklendi:", parsedData.length);
            // Veri filtreleme
            if (type) {
              return parsedData.filter((expense) => expense.type === type);
            }
            return parsedData;
          }
        } catch (parseError) {
          console.error("JSON ayrıştırma hatası:", parseError);
        }
      }
    } catch (storageError) {
      console.warn("LocalStorage erişim hatası:", storageError);
    }
    
    // Veri tabanından yüklemeyi dene
    const allExpenses = await getAllData("expenses");

    if (allExpenses && Array.isArray(allExpenses) && allExpenses.length > 0) {
      // Önbelleğe kaydet
      try {
        localStorage.setItem('expenseTypes', JSON.stringify(allExpenses));
      } catch (e) {}
      
      // Veri filtreleme
      if (type) {
        return allExpenses.filter((expense) => expense.type === type);
      }
      return allExpenses;
    }
    
    // Veri bulunamadıysa varsayılan verileri kullan
    console.info("Veri tabanında gider türleri bulunamadı, varsayılan veriler kullanılıyor");
    
    // Varsayılan verileri önbelleğe kaydet
    try {
      localStorage.setItem('expenseTypes', JSON.stringify(defaultExpenseTypes));
    } catch (e) {}
    
    // Veri filtreleme
    if (type) {
      return defaultExpenseTypes.filter((expense) => expense.type === type);
    }
    return defaultExpenseTypes;
  } catch (error) {
    console.error("Gider türleri alınırken hata:", error);
    
    // Hata durumunda varsayılan verileri döndür
    if (type) {
      return defaultExpenseTypes.filter((expense) => expense.type === type);
    }
    return defaultExpenseTypes;
  }
}

// Sağlayıcıları kaydet
export const saveProviders = async (providers: any[]): Promise<void> => {
  try {
    // Önce mevcut sağlayıcıları temizle
    await clearStore("providers")

    // Sonra yeni sağlayıcıları ekle
    for (const provider of providers) {
      await addData("providers", provider)
    }
  } catch (error) {
    console.error("Sağlayıcılar kaydedilirken hata:", error)
    throw error
  }
}

// Sağlayıcıları getir
export const getProviders = async (): Promise<any[]> => {
  // Varsayılan sağlayıcılar
  const defaultProviders = [
    { id: "default-provider-1", name: "ABC Tur", type: "tour_operator", contact: "0212 123 4567", address: "İstanbul" },
    { id: "default-provider-2", name: "XYZ Hotel", type: "accommodation", contact: "0216 765 4321", address: "Antalya" },
    { id: "default-provider-3", name: "Güven Transfer", type: "transportation", contact: "0532 987 6543", address: "İzmir" }
  ];

  try {
    // Önce localStorage'dan kontrol et
    try {
      const cachedData = localStorage.getItem('providers');
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
            console.log("Sağlayıcılar önbellekten yüklendi:", parsedData.length);
            return parsedData;
          }
        } catch (parseError) {
          console.error("JSON ayrıştırma hatası:", parseError);
        }
      }
    } catch (storageError) {
      console.warn("LocalStorage erişim hatası:", storageError);
    }

    // Veri tabanından yüklemeyi dene
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        if (!db.objectStoreNames.contains("providers")) {
          console.log("'providers' deposu bulunamadı, varsayılan veriler kullanılıyor");
          db.close();
          
          // Önbelleğe kaydet
          try {
            localStorage.setItem('providers', JSON.stringify(defaultProviders));
          } catch (e) {}
          
          resolve(defaultProviders);
          return;
        }

        const transaction = db.transaction("providers", "readonly");
        const store = transaction.objectStore("providers");
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result || [];
          console.log("Yüklenen sağlayıcılar:", results.length, "adet");
          
          if (results.length > 0) {
            // Önbelleğe kaydet
            try {
              localStorage.setItem('providers', JSON.stringify(results));
            } catch (cacheError) {
              console.warn("Sağlayıcılar önbelleğe kaydedilemedi:", cacheError);
            }
            
            resolve(results);
          } else {
            console.log("Veri tabanında sağlayıcı bulunamadı, varsayılan veriler kullanılıyor");
            
            // Önbelleğe kaydet
            try {
              localStorage.setItem('providers', JSON.stringify(defaultProviders));
            } catch (e) {}
            
            resolve(defaultProviders);
          }
        };

        request.onerror = () => {
          console.error("Sağlayıcılar alınırken hata:", request.error);
          db.close();
          
          // Önbelleğe kaydet
          try {
            localStorage.setItem('providers', JSON.stringify(defaultProviders));
          } catch (e) {}
          
          resolve(defaultProviders);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      } catch (txError) {
        console.error("Sağlayıcı transaction hatası:", txError);
        try { db.close(); } catch (e) {}
        
        // Önbelleğe kaydet
        try {
          localStorage.setItem('providers', JSON.stringify(defaultProviders));
        } catch (e) {}
        
        resolve(defaultProviders);
      }
    });
  } catch (error) {
    console.error("Sağlayıcı yükleme hatası:", error);
    
    // Önbelleğe kaydet
    try {
      localStorage.setItem('providers', JSON.stringify(defaultProviders));
    } catch (e) {}
    
    return defaultProviders;
  }
};

// Aktiviteleri kaydet
export const saveActivities = async (activities: any[]): Promise<void> => {
  try {
    // Önce mevcut aktiviteleri temizle
    await clearStore("activities")

    // Sonra yeni aktiviteleri ekle
    for (const activity of activities) {
      await addData("activities", activity)
    }
  } catch (error) {
    console.error("Aktiviteler kaydedilirken hata:", error)
    throw error
  }
};

// Aktiviteleri getir
export const getActivities = async (): Promise<any[]> => {
  // Varsayılan aktiviteler - her durumda kullanılabilir
  const defaultActivities = [
    { id: "default-act-1", name: "Tekne Turu", destinationId: "default-dest-1", price: "300", currency: "TRY", description: "Güzel bir tekne turu" },
    { id: "default-act-2", name: "Müze Gezisi", destinationId: "default-dest-2", price: "150", currency: "TRY", description: "Tarihi müze gezisi" },
    { id: "default-act-3", name: "Balon Turu", destinationId: "default-dest-3", price: "2000", currency: "TRY", description: "Kapadokya'da balon turu" }
  ];
  
  try {
    // Önce localStorage'dan yüklemeyi dene
    try {
      const cachedActivities = localStorage.getItem('activities');
      if (cachedActivities) {
        try {
          const parsedActivities = JSON.parse(cachedActivities);
          if (parsedActivities && Array.isArray(parsedActivities) && parsedActivities.length > 0) {
            console.log("Aktiviteler önbellekten yüklendi:", parsedActivities.length, "adet");
            return parsedActivities;
          }
        } catch (parseError) {
          console.error("Aktivite JSON ayrıştırma hatası:", parseError);
        }
      }
    } catch (cacheError) {
      console.warn("Aktiviteler önbellekten yüklenemedi:", cacheError);
    }
    
    // IndexedDB'den yüklemeye çalış
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        if (!db.objectStoreNames.contains("activities")) {
          console.log("'activities' deposu bulunamadı, varsayılan veriler kullanılıyor");
          db.close();
          
          // Önbelleğe kaydet
          try {
            localStorage.setItem('activities', JSON.stringify(defaultActivities));
          } catch (e) {}
          
          resolve(defaultActivities);
          return;
        }

        const transaction = db.transaction("activities", "readonly");
        const store = transaction.objectStore("activities");
        const request = store.getAll();

        request.onsuccess = () => {
          const activities = request.result || [];
          console.log("Yüklenen aktiviteler:", activities.length, "adet");
          
          if (activities.length > 0) {
            // Önbelleğe kaydet
            try {
              localStorage.setItem('activities', JSON.stringify(activities));
            } catch (cacheError) {
              console.warn("Aktiviteler önbelleğe kaydedilemedi:", cacheError);
            }
            
            resolve(activities);
          } else {
            console.log("Veri tabanında aktivite bulunamadı, varsayılan veriler kullanılıyor");
            
            // Önbelleğe kaydet
            try {
              localStorage.setItem('activities', JSON.stringify(defaultActivities));
            } catch (e) {}
            
            resolve(defaultActivities);
          }
        };

        request.onerror = () => {
          console.error("Aktiviteler alınırken hata:", request.error);
          
          try { db.close(); } catch (e) {}
          
          // Hata durumunda varsayılan verileri döndür
          try {
            localStorage.setItem('activities', JSON.stringify(defaultActivities));
          } catch (e) {}
          
          resolve(defaultActivities);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      } catch (txError) {
        console.error("Aktivite transaction hatası:", txError);
        try { db.close(); } catch (e) {}
        
        // Hata durumunda varsayılan verileri döndür
        try {
          localStorage.setItem('activities', JSON.stringify(defaultActivities));
        } catch (e) {}
        
        resolve(defaultActivities);
      }
    });
  } catch (error) {
    console.error("Aktivite yükleme hatası:", error);
    
    // Hata durumunda varsayılan verileri döndür
    try {
      localStorage.setItem('activities', JSON.stringify(defaultActivities));
    } catch (cacheError) {}
    
    return defaultActivities;
  }
};

// Destinasyonları getir
export const getDestinations = async (): Promise<any[]> => {
  // Daima döndürülecek varsayılan destinasyonlar
  const defaultDestinations = [
    { id: "default-dest-1", name: "Antalya", country: "Türkiye", description: "Güzel sahiller" },
    { id: "default-dest-2", name: "İstanbul", country: "Türkiye", description: "Tarihi yarımada" },
    { id: "default-dest-3", name: "Kapadokya", country: "Türkiye", description: "Peri bacaları" },
    { id: "default-dest-4", name: "Bodrum", country: "Türkiye", description: "Güzel koylar" },
    { id: "default-dest-5", name: "Fethiye", country: "Türkiye", description: "Oludeniz" }
  ];

  try {
    // Önce localStorage'dan yüklemeyi dene
    try {
      const cachedDestinations = localStorage.getItem('destinations');
      if (cachedDestinations) {
        try {
          const parsedDestinations = JSON.parse(cachedDestinations);
          if (parsedDestinations && Array.isArray(parsedDestinations) && parsedDestinations.length > 0) {
            console.log("Destinasyonlar önbellekten yüklendi:", parsedDestinations.length, "adet");
            // Önbellekteki verilere varsayılan destinasyonları ekle (tekrarları önlemek için ID kontrolü yap)
            const combinedDestinations = [...parsedDestinations];
            defaultDestinations.forEach(dest => {
              if (!combinedDestinations.some(existing => existing.id === dest.id)) {
                combinedDestinations.push(dest);
              }
            });
            return combinedDestinations;
          }
        } catch (parseError) {
          console.error("Destinasyon JSON parse hatası:", parseError);
          // JSON parse hatası durumunda varsayılan verileri önbelleğe kaydet ve kullan
          try {
            localStorage.setItem('destinations', JSON.stringify(defaultDestinations));
          } catch (e) {}
          return defaultDestinations;
        }
      }
    } catch (cacheError) {
      console.warn("Destinasyonlar önbellekten yüklenemedi:", cacheError);
      // Önbellek hatası olursa IndexedDB'den devam et
    }
    
    // IndexedDB'den yüklemeye çalış
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        if (!db.objectStoreNames.contains("destinations")) {
          console.log("'destinations' deposu bulunamadı, varsayılan veriler kullanılıyor");
          db.close();
          resolve(defaultDestinations);
          return;
        }

        const transaction = db.transaction("destinations", "readonly");
        const store = transaction.objectStore("destinations");
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result || [];
          console.log("Yüklenen destinasyonlar:", results.length, "adet");
          
          if (results.length > 0) {
            // Veri tabanındaki verilere varsayılan destinasyonları ekle
            const combinedDestinations = [...results];
            defaultDestinations.forEach(dest => {
              if (!combinedDestinations.some(existing => existing.id === dest.id)) {
                combinedDestinations.push(dest);
              }
            });
            
            try {
              localStorage.setItem('destinations', JSON.stringify(combinedDestinations));
            } catch (cacheError) {
              console.warn("Destinasyonlar önbelleğe kaydedilemedi:", cacheError);
            }
            
            resolve(combinedDestinations);
          } else {
            // Veri tabanında veri yoksa varsayılan destinasyonları kullan
            try {
              localStorage.setItem('destinations', JSON.stringify(defaultDestinations));
            } catch (e) {}
            resolve(defaultDestinations);
          }
        };

        request.onerror = () => {
          console.error("Destinasyonlar alınırken hata:", request.error);
          db.close();
          // Hata durumunda varsayılan verileri kullan
          resolve(defaultDestinations);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      } catch (txError) {
        console.error("Destinasyon transaction hatası:", txError);
        try { db.close(); } catch (e) {}
        // Hata durumunda varsayılan verileri kullan
        resolve(defaultDestinations);
      }
    });
  } catch (error) {
    console.error("Destinasyon yükleme hatası:", error);
    
    // Herhangi bir hata durumunda varsayılan destinasyonları döndür
    try {
      localStorage.setItem('destinations', JSON.stringify(defaultDestinations));
    } catch (cacheError) {}
    
    return defaultDestinations;
  }
};

// AI ayarlarını kaydet
export const saveAISettings = async (settings: any): Promise<any> => {
  settings.id = "ai-settings" // Sabit bir ID kullan
  return updateData("settings", settings)
}

// AI ayarlarını getir
export const getAISettings = async (): Promise<any> => {
try {
  const settings = await getDataById("settings", "ai-settings")
  return (
    settings || {
      apiKey: "",
      provider: "openai",
      model: "gpt-3.5-turbo",
      geminiModel: "models/gemini-pro", // "gemini-pro" yerine "models/gemini-pro" olarak değiştirdik
      geminiApiKey: "",
      instructions: "",
      programControl: true,
    }
  ) // Ayarlar yoksa varsayılan değerler
} catch (error) {
  console.error("AI ayarları alınırken hata:", error)
  return {
    apiKey: "",
    provider: "openai",
    model: "gpt-3.5-turbo",
    geminiModel: "models/gemini-pro", // "gemini-pro" yerine "models/gemini-pro" olarak değiştirdik
    geminiApiKey: "",
    instructions: "",
    programControl: true,
  }
}
}

// AI konuşmalarını kaydet
export const saveAIConversation = async (conversation: any): Promise<any> => {
  if (!conversation.id) {
    conversation.id = generateUUID()
  }
  conversation.timestamp = new Date().toISOString()
  return addData("ai_conversations", conversation)
}

// AI konuşmalarını getir
export const getAIConversations = async (): Promise<any[]> => {
  try {
    const conversations = await getAllData("ai_conversations")
    return conversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (error) {
    console.error("AI konuşmaları alınırken hata:", error)
    return []
  }
}

// Müşteri notlarını kaydet
export const saveCustomerNote = async (note: any): Promise<any> => {
  if (!note.id) {
    note.id = generateUUID()
  }
  note.timestamp = new Date().toISOString()
  return addData("customer_notes", note)
}

// Müşteri notlarını getir
export const getCustomerNotes = async (customerId?: string): Promise<any[]> => {
  try {
    const notes = await getAllData("customer_notes")
    if (customerId) {
      return notes
        .filter((note) => note.customerId === customerId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }
    return notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (error) {
    console.error("Müşteri notları alınırken hata:", error)
    return []
  }
}

// UUID oluşturucu fonksiyon (zaten varsa kullanın)
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Referans kaynaklarını kaydet
export const saveReferralSources = async (sources: any[]): Promise<void> => {
  try {
    // Önce mevcut referans kaynaklarını temizle
    await clearStore("referral_sources");

    // Aynı id'li kayıtları filtrele (unique id)
    const uniqueSources = Array.from(
      new Map(sources.map(item => [item.id, item])).values()
    );

    // Sonra yeni referans kaynaklarını ekle (updateData ile)
    for (const source of uniqueSources) {
      await updateData("referral_sources", source);
    }

    // Önbellekte de sakla
    try {
      localStorage.setItem('referralSources', JSON.stringify(uniqueSources));
    } catch (e) {
      console.warn("Referans kaynakları önbellekte saklanamadı:", e);
    }
  } catch (error) {
    console.error("Referans kaynakları kaydedilirken hata:", error)
    throw error
  }
};

// Destinasyonları kaydet
export const saveDestinations = async (destinations: any[]): Promise<void> => {
  try {
    // Önce localStorage'a kaydet (hızlı erişim için)
    try {
      localStorage.setItem('destinations', JSON.stringify(destinations));
      console.log("Destinasyonlar önbelleğe kaydedildi:", destinations.length);
    } catch (storageError) {
      console.warn("LocalStorage erişim hatası:", storageError);
    }

    // Veritabanında mevcut verileri temizle
    await clearStore("destinations");

    // Yeni verileri ekle
    for (const destination of destinations) {
      await addData("destinations", destination);
    }
    
    console.log("Destinasyonlar veritabanına kaydedildi:", destinations.length);
  } catch (error) {
    console.error("Destinasyonlar kaydedilirken hata:", error);
    throw error;
  }
};

// Referans kaynaklarını getir
export const getReferralSources = async (): Promise<any[]> => {
  // Varsayılan referans kaynakları (Tamamen Türkçe)
  const defaultReferralSources = [
    { id: "website", name: "İnternet Sitemiz", type: "çevrimiçi", isDefault: true },
    { id: "hotel", name: "Otel Yönlendirmesi", type: "iş ortağı", isDefault: true },
    { id: "local_guide", name: "Hanutçu / Yerel Rehber", type: "iş ortağı", isDefault: true },
    { id: "walk_in", name: "Kapı Önü Müşterisi", type: "doğrudan", isDefault: true },
    { id: "repeat", name: "Tekrar Gelen Müşteri", type: "doğrudan", isDefault: true },
    { id: "recommendation", name: "Tavsiye", type: "organik", isDefault: true },
    { id: "social_media", name: "Sosyal Medya", type: "çevrimiçi", isDefault: true },
    { id: "other", name: "Diğer", type: "diğer", isDefault: true }
  ];

  try {
    // Önce localStorage'dan kontrol et
    try {
      const cachedData = localStorage.getItem('referralSources');
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
            console.log("Referans kaynakları önbellekten yüklendi:", parsedData.length);
            return parsedData;
          }
        } catch (parseError) {
          console.error("JSON ayrıştırma hatası:", parseError);
        }
      }
    } catch (storageError) {
      console.warn("LocalStorage erişim hatası:", storageError);
    }
    
    // Veri tabanından yüklemeyi dene
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        if (!db.objectStoreNames.contains("referral_sources")) {
          console.log("'referral_sources' deposu bulunamadı, varsayılan veriler kullanılıyor");
          db.close();
          
          // Önbelleğe kaydet
          try {
            localStorage.setItem('referralSources', JSON.stringify(defaultReferralSources));
          } catch (e) {}
          
          resolve(defaultReferralSources);
          return;
        }

        const transaction = db.transaction("referral_sources", "readonly");
        const store = transaction.objectStore("referral_sources");
        const request = store.getAll();

        request.onsuccess = () => {
          const sources = request.result || [];
          console.log("Yüklenen referans kaynakları:", sources.length, "adet");
          
          if (sources.length > 0) {
            // Önbelleğe kaydet
            try {
              localStorage.setItem('referralSources', JSON.stringify(sources));
            } catch (cacheError) {
              console.warn("Referans kaynakları önbelleğe kaydedilemedi:", cacheError);
            }
            
            resolve(sources);
          } else {
            console.log("Veri tabanında referans kaynağı bulunamadı, varsayılan veriler kullanılıyor");
            
            // Varsayılan verileri kaydet
            saveReferralSources(defaultReferralSources)
              .then(() => {
                resolve(defaultReferralSources);
              })
              .catch((saveError) => {
                console.error("Varsayılan referans kaynakları kaydedilemedi:", saveError);
                resolve(defaultReferralSources);
              });
          }
        };

        request.onerror = () => {
          console.error("Referans kaynakları alınırken hata:", request.error);
          db.close();
          
          // Önbelleğe kaydet
          try {
            localStorage.setItem('referralSources', JSON.stringify(defaultReferralSources));
          } catch (e) {}
          
          resolve(defaultReferralSources);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      } catch (txError) {
        console.error("Referans kaynakları transaction hatası:", txError);
        try { db.close(); } catch (e) {}
        
        // Önbelleğe kaydet
        try {
          localStorage.setItem('referralSources', JSON.stringify(defaultReferralSources));
        } catch (e) {}
        
        resolve(defaultReferralSources);
      }
    });
  } catch (error) {
    console.error("Referans kaynakları yükleme hatası:", error);
    
    // Önbelleğe kaydet
    try {
      localStorage.setItem('referralSources', JSON.stringify(defaultReferralSources));
    } catch (e) {}
    
    return defaultReferralSources;
  }
};
