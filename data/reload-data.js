// Destinasyon ve aktivite verilerini yenilemek için script
(async function resetDestinationsAndActivities() {
  console.log("Veri güncelleme işlemi başlatılıyor...");

  try {
    // IndexedDB veritabanına bağlan
    const DB_NAME = "passionistravelDB";
    const DB_VERSION = 1;
    
    // Veritabanını aç
    const openDB = () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject("Veritabanı açılamadı: " + request.error);
        request.onsuccess = () => resolve(request.result);
      });
    };
    
    // 1. Öncelikle veritabanındaki eski verileri temizle
    const db = await openDB();
    console.log("Veritabanı bağlantısı kuruldu.");
    
    const clearStore = (storeName) => {
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction(storeName, "readwrite");
          const store = transaction.objectStore(storeName);
          const request = store.clear();
          
          request.onsuccess = () => {
            console.log(`${storeName} deposu temizlendi.`);
            resolve();
          };
          
          request.onerror = () => {
            console.error(`${storeName} deposu temizlenirken hata: ${request.error}`);
            reject(request.error);
          };
        } catch (error) {
          console.error(`Temizleme işlemi hatası (${storeName}):`, error);
          reject(error);
        }
      });
    };
    
    // Önce localStorage'daki eski verileri temizle
    localStorage.removeItem("destinations");
    localStorage.removeItem("activities");
    
    // IndexedDB'deki verileri temizle
    await clearStore("destinations");
    await clearStore("activities");
    console.log("Veritabanı temizlendi.");
    
    // 2. JSON dosyalarından yeni verileri yükle
    const loadJSON = async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error("JSON yükleme hatası:", error);
        throw error;
      }
    };
    
    const destinations = await loadJSON("/data/sample-destinations.json");
    const activities = await loadJSON("/data/sample-activities.json");
    
    console.log(`Yüklenen destinasyonlar: ${destinations.length}`);
    console.log(`Yüklenen aktiviteler: ${activities.length}`);
    
    // 3. Yeni verileri veritabanına ekle
    const addData = (storeName, data) => {
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction(storeName, "readwrite");
          const store = transaction.objectStore(storeName);
          const request = store.add(data);
          
          request.onsuccess = () => {
            resolve(data);
          };
          
          request.onerror = () => {
            console.error(`Veri eklenirken hata: ${request.error}`);
            reject(request.error);
          };
        } catch (error) {
          console.error(`Veri ekleme işlemi hatası (${storeName}):`, error);
          reject(error);
        }
      });
    };
    
    // Destinasyonları ekle
    for (const destination of destinations) {
      try {
        await addData("destinations", destination);
      } catch (error) {
        console.error("Destination eklenirken hata:", error);
      }
    }
    
    // Aktiviteleri ekle
    for (const activity of activities) {
      try {
        await addData("activities", activity);
      } catch (error) {
        console.error("Activity eklenirken hata:", error);
      }
    }
    
    // 4. LocalStorage'a da yeni verileri kaydet
    localStorage.setItem("destinations", JSON.stringify(destinations));
    localStorage.setItem("activities", JSON.stringify(activities));
    
    console.log("Veriler başarıyla güncellendi!");
    console.log("Lütfen sayfayı yenileyin (F5)");
    
    // İşlem sonucu olarak kullanıcıya bilgi ver
    alert("Destinasyon ve aktivite verileri başarıyla güncellendi!\nSayfayı yenileyin (F5).");
    
    // İsteğe bağlı olarak sayfayı otomatik yenile
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    console.error("Veri güncelleme işlemi sırasında hata:", error);
    alert("Veri güncelleme sırasında bir hata oluştu. Lütfen konsolu kontrol edin.");
  }
})();