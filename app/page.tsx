"use client"

import { useState, useEffect } from "react"
import AppLoadSampleData from "./_app-load-sample-data"
import { MainDashboard } from "../components/main-dashboard"
import { FinancialEntryForm } from "../components/financial-entry-form"
import { TourSalesForm } from "../components/tour-sales-form"
import { DataView } from "../components/data-view"
import { SettingsView } from "../components/settings-view"
import { EnhancedAnalyticsView } from "../components/enhanced-analytics-view"
import { DashboardView } from "../components/dashboard-view"
import { CalendarView } from "../components/calendar-view"
import { BackupRestoreView } from "../components/backup-restore"
import { SplashScreen } from "../components/splash-screen"
import { Toaster } from "../components/ui/toaster"
import { useToast } from "../components/ui/use-toast"
import dynamic from "next/dynamic";
const CurrencyPage = dynamic(() => import("./currency/page"), { ssr: false });
import { exportData, importData } from "../lib/export-import"
import { getAllData, addData, updateData, initializeDB, clearStore, deleteData } from "../lib/db"
import { CustomerView } from "../components/customer-view"
import { MainHeader } from "../components/main-header"
import { Sidebar } from "../components/sidebar"
import { useRouter } from 'next/navigation'
import { generateUUID } from "../lib/utils";

interface TourActivity {
  id: string;
  activityId: string;
  name: string;
  date: string;
  duration?: string;
  price: string | number;
  currency: string;
  participants: string;
  participantsType: string;
  providerId: string;
  details?: string;
}

interface TourAdditionalCustomer {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  address?: string;
}

interface TourExpense {
  id: string;
  type: string;
  name: string;
  amount: string | number;
  currency: string;
  details?: string;
  isIncludedInPrice: boolean;
  rehberInfo?: string;
  transferType?: string;
  transferPerson?: string;
  acentaName?: string;
  provider?: string;
  description?: string;
  date?: string | Date;
  category?: string;
}

interface TourData {
  id: string;
  serialNumber?: string;
  tourName?: string;
  tourDate: string | Date;
  tourEndDate?: string | Date;
  numberOfPeople: number;
  numberOfChildren: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerIdNumber?: string;
  customerTC?: string;
  customerPassport?: string;
  customerDrivingLicense?: string;
  pricePerPerson: string | number;
  totalPrice: string | number;
  currency?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  partialPaymentAmount?: string | number;
  partialPaymentCurrency?: string;
  notes?: string;
  activities?: TourActivity[];
  companyName?: string;
  additionalCustomers?: TourAdditionalCustomer[];
  expenses?: TourExpense[];
  nationality?: string;
  destination?: string;
  destinationId?: string;
  destinationName?: string;
  referralSource?: string;
  createdAt?: string;
  updatedAt?: string;
  customerAddress?: string;
}

interface FinancialData {
  id: string;
  date: string | Date;
  type: string;
  category?: string;
  description?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  relatedTourId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CustomerData {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  citizenship?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<string>("splash")
  const [financialData, setFinancialData] = useState<FinancialData[]>([])
  const [toursData, setToursData] = useState<TourData[]>([])
  const [customersData, setCustomersData] = useState<CustomerData[]>([])
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [splashFinished, setSplashFinished] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [isAIOpen, setIsAIOpen] = useState(false)

  // Add state to store temporary form data
  const [tempTourFormData, setTempTourFormData] = useState<any>(null)
  const [previousView, setPreviousView] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Sadece giriş yapılmamışsa admin login'e yönlendir
      const isLoggedIn = localStorage.getItem('adminLoggedIn');
      if (!isLoggedIn) {
        localStorage.removeItem('financialData');
        localStorage.removeItem('toursData');
        localStorage.removeItem('customerData');
        window.location.href = '/admin/login';
      }
      // Eğer giriş yapılmışsa ana sayfada kal
    } catch (err) {
      console.error('Home redirect error:', err);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        if (typeof window !== 'undefined') {
          console.log("Veritabanından veriler yükleniyor...");
          await initializeDB();

          // 1. IndexedDB'den veri yükle
          const financialDataFromDB = await getAllData("financials") as FinancialData[];
          const toursDataFromDB = await getAllData("tours") as TourData[];
          const customersDataFromDB = await getAllData("customers") as CustomerData[];

          let financialLoaded = false;
          let toursLoaded = false;
          let customersLoaded = false;

          if (financialDataFromDB && financialDataFromDB.length > 0) {
            setFinancialData(financialDataFromDB);
            financialLoaded = true;
          }
          if (toursDataFromDB && toursDataFromDB.length > 0) {
            setToursData(toursDataFromDB);
            toursLoaded = true;
          }
          if (customersDataFromDB && customersDataFromDB.length > 0) {
            setCustomersData(customersDataFromDB);
            customersLoaded = true;
          }

          // 2. Eğer hiç veri yoksa örnek dosyadan yükle (örnekler sadece ilk açılışta)
          if (!financialLoaded || !toursLoaded || !customersLoaded) {
            const loadSample = async (file: string): Promise<any | null> => {
              // public/data/ dizininde olmalı
              try {
                const res = await fetch(`/data/${file}`);
                if (!res.ok) return null;
                return await res.json();
              } catch (err) { return null; }
            };
            if (!financialLoaded) {
              const financeSample = await loadSample('sample-finance.json');
              if (financeSample && financeSample.expenses && financeSample.incomes) {
                const allFinancials = [
                  ...financeSample.expenses.map((e: any) => ({ ...e, type: 'expense' })),
                  ...financeSample.incomes.map((e: any) => ({ ...e, type: 'income' }))
                ];
                setFinancialData(allFinancials);
                await clearStore("financials");
                for (const item of allFinancials) {
                  await addData("financials", item);
                }
              }
            }
            if (!toursLoaded) {
              const toursSample = await loadSample('sample-tours.json');
              if (toursSample && Array.isArray(toursSample)) {
                setToursData(toursSample);
                await clearStore("tours");
                for (const item of toursSample) {
                  await addData("tours", item);
                }
              }
            }
            if (!customersLoaded) {
              // Eğer müşteri dosyan yoksa, turlardan müşteri üret
              const toursSample = await loadSample('sample-tours.json');
              if (toursSample && Array.isArray(toursSample)) {
                const customers = toursSample.map((t: any) => ({
                  id: t.customerPhone || t.customerEmail || generateUUID(),
                  name: t.customerName,
                  phone: t.customerPhone,
                  email: t.customerEmail
                }));
                setCustomersData(customers);
                await clearStore("customers");
                for (const item of customers) {
                  await addData("customers", item);
                }
              }
            }
          }
          setSplashFinished(true);
        }
      } catch (error) {
        console.error("Veriler yüklenirken hata oluştu:", error);
        setSplashFinished(true);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    // Veritabanını başlat
    const setupDB = async () => {
      try {
        await initializeDB()
      } catch (error) {
        console.error("Veritabanı başlatma hatası:", error)
      }
    }

    setupDB()
  }, [])

  // Müşteri verilerini güncelle citizenship değerlerini doldur
  useEffect(() => {
    const updateCustomersWithCitizenship = async () => {
      try {
        // Mevcut müşteri verilerini kontrol et
        const updatedCustomers = customersData.map(customer => {
          // Eğer citizenship yoksa ve tour dataları içinde bu müşteriye ait bir kayıt varsa nationality değerini citizenship'e ata
          if (!customer.citizenship) {
            // Müşteriye ait tour kaydını bul
            const relatedTour = toursData.find(
              tour => tour.customerPhone === customer.phone || 
                     tour.customerEmail === customer.email || 
                     tour.customerIdNumber === customer.idNumber
            );
            
            // Tour kaydı varsa ve nationality değeri doluysa
            if (relatedTour && relatedTour.nationality) {
              return { ...customer, citizenship: relatedTour.nationality };
            }
          }
          return customer;
        });

        // Değişiklik olan müşteri varsa veriyi güncelle
        if (JSON.stringify(updatedCustomers) !== JSON.stringify(customersData)) {
          console.log("Müşteri citizenship verileri güncelleniyor...");
          await handleDataUpdate("customers", updatedCustomers);
        }
      } catch (error) {
        console.error("Müşteri verileri güncellenirken hata:", error);
      }
    };

    // Uygulamanın ilk yüklenmesinde bir kez çalıştır
    if (customersData.length > 0 && toursData.length > 0) {
      updateCustomersWithCitizenship();
    }
  }, [customersData, toursData]);

  const handleSplashFinish = () => {
    setCurrentView("main-dashboard")
  }

  const navigateTo = (view: string) => {
    // Sidebar'dan Döviz butonuna tıklanınca yönlendirme
    if (view === "currency") {
      setCurrentView("currency");
      return;
    }

    // Ana ekrandan tur düzenleme için tıklanınca
    if (view.startsWith("edit-tour-")) {
      const tourId = view.replace("edit-tour-", "");
      // Turu bul
      const tourToEdit = toursData.find(tour => 
        tour.id === tourId || 
        tour.serialNumber === tourId
      );
      
      if (tourToEdit) {
        console.log("Ana sayfadan tur düzenleme:", tourToEdit);
        // Derin kopya oluştur
        const tourCopy = JSON.parse(JSON.stringify(tourToEdit));
        // Düzenlenecek kaydı ayarla
        setEditingRecord(tourCopy);
        // Tour-sales formuna git
        setCurrentView("tour-sales");
        return;
      }
    }
    
    // Ana ekrandan finans kaydı düzenleme için tıklanınca
    if (view.startsWith("edit-financial-")) {
      const financialId = view.replace("edit-financial-", "");
      // Finans kaydını bul
      const financialToEdit = financialData.find(financial => financial.id === financialId);
      
      if (financialToEdit) {
        console.log("Ana sayfadan finans kaydı düzenleme:", financialToEdit);
        // Derin kopya oluştur
        const financialCopy = JSON.parse(JSON.stringify(financialToEdit));
        // Düzenlenecek kaydı ayarla
        setEditingRecord(financialCopy);
        // Financial-entry formuna git
        setCurrentView("financial-entry");
        return;
      }
    }
    
    // Store the current view before changing
    if (currentView !== view) {
      setPreviousView(currentView)

      // If navigating away from tour-sales to settings, store the form data
      if (currentView === "tour-sales" && view === "settings") {
        // We'll set a flag to indicate we need to return to tour-sales
        localStorage.setItem("returnToTourSales", "true")
      }
    }

    setCurrentView(view)

    // Düzenleme kaydı varsa ve ilgili düzenleme formlarına geçmiyorsak sıfırla
    const editForms = ["tour-sales", "financial-entry", "customers"];
    if (editingRecord && !editForms.includes(view)) {
      setEditingRecord(null)
    }
  }

  const handleDataUpdate = async (type: string, newData: any[]) => {
    try {
      if (type === "financial") {
        // Finansal verileri güncelle
        setFinancialData(newData as FinancialData[])
        
        // IndexedDB'yi güncelle
        await clearStore("financials");
        for (const item of newData) {
          await addData("financials", item);
        }
        
        // Ayrıca localStorage'a da kaydet (yedek olarak)
        localStorage.setItem("financialData", JSON.stringify(newData));
        
        console.log("Finansal veriler güncellendi:", newData);
      } else if (type === "tours") {
        // Tur verilerini güncelle
        // Aynı id'ye sahip kayıt varsa önce sil, sonra ekle
        setToursData(newData as TourData[])
        
        await clearStore("tours");
        for (const item of newData) {
          // addData hata verirse updateData ile güncelle
          try {
            await addData("tours", item);
          } catch (e: any) { // 'any' olarak belirtilen error tipi özelliklere erişim için
            // Eğer anahtar çakışması hatası ise, önce silip tekrar ekle
            if (e && typeof e === 'object' && 'name' in e && e.name === "ConstraintError") {
              await deleteData("tours", item.id);
              await addData("tours", item);
            } else {
              throw e;
            }
          }
        }
        
        localStorage.setItem("toursData", JSON.stringify(newData));
        
        console.log("Tur verileri güncellendi:", newData);
      } else if (type === "customers") {
        // Müşteri verilerini güncelle
        setCustomersData(newData as CustomerData[])
        
        // IndexedDB'yi güncelle
        await clearStore("customers");
        for (const item of newData) {
          await addData("customers", item);
        }
        
        // Ayrıca localStorage'a da kaydet (yedek olarak)
        localStorage.setItem("customerData", JSON.stringify(newData));
        
        console.log("Müşteri verileri güncellendi:", newData);
      }

      toast({
        title: "Başarılı!",
        description: "Veriler başarıyla güncellendi.",
      })
    } catch (error: any) {
      console.error("Veri güncelleme hatası:", error)
      toast({
        title: "Hata",
        description: "Veriler güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  // Tur giderlerini finansal kayıtlara ekleyen yardımcı fonksiyon
  const addTourExpensesToFinancials = async (tourData: TourData) => {
    try {
      // Önce bu tura ait eski giderleri sil
      const allFinancials = await getAllData("financials") as FinancialData[];
      const oldTourExpenses = allFinancials.filter(
        (item) => item.relatedTourId === tourData.id && item.type === "expense"
      );
      for (const oldExpense of oldTourExpenses) {
        await deleteData("financials", oldExpense.id);
      }

      // Tur giderlerini finansal kayıtlara ekle
      if (tourData.expenses && tourData.expenses.length > 0) {
        for (const expense of tourData.expenses) {
          const expenseAmount = typeof expense.amount === "string" 
            ? parseFloat(expense.amount) 
            : expense.amount || 0;
            
          if (!expenseAmount || expenseAmount <= 0) continue;

          // Her gider için benzersiz bir id üret (turId + giderId)
          const expenseId = `${tourData.id}-${expense.id || generateUUID()}`;

          const financialRecord: FinancialData = {
            id: expenseId,
            date: new Date().toISOString(),
            type: "expense",
            category: expense.category || "Tur Gideri",
            description: `${tourData.tourName || 'İsimsiz Tur'} - ${expense.name || 'Gider'} (${tourData.serialNumber || 'No'})`,
            amount: expenseAmount,
            currency: expense.currency || "TRY",
            paymentMethod: "cash",
            relatedTourId: tourData.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await addData("financials", financialRecord);
        }

        // Ekrandaki state'i de güncelle
        const updatedFinancials = allFinancials
          .filter((item) => !(item.relatedTourId === tourData.id && item.type === "expense"))
          .concat(
            tourData.expenses
              .filter((expense) => {
                const expenseAmount = typeof expense.amount === "string" 
                  ? parseFloat(expense.amount) 
                  : expense.amount || 0;
                return expenseAmount > 0;
              })
              .map((expense) => {
                const expenseAmount = typeof expense.amount === "string" 
                  ? parseFloat(expense.amount) 
                  : expense.amount || 0;
                  
                return {
                  id: `${tourData.id}-${expense.id || generateUUID()}`,
                  date: new Date().toISOString(),
                  type: "expense",
                  category: expense.category || "Tur Gideri",
                  description: `${tourData.tourName || 'İsimsiz Tur'} - ${expense.name || 'Gider'} (${tourData.serialNumber || 'No'})`,
                  amount: expenseAmount,
                  currency: expense.currency || "TRY",
                  paymentMethod: "cash",
                  relatedTourId: tourData.id,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
              })
          );
        setFinancialData(updatedFinancials);

        toast({
          title: "Bilgi",
          description: "Tur giderleri finansal kayıtlara aktarıldı.",
        });
      }
    } catch (error) {
      console.error("Tur giderleri finansal kayıtlara eklenirken hata:", error);
      toast({
        title: "Uyarı",
        description: "Tur giderleri finansal kayıtlara eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleSaveTour = async (tourData: any) => {
    try {
      console.log("handleSaveTour başladı:", tourData);

      // Öncelikle müşteri kaydetme kontrolü - eğer bu müşteri daha önce kaydedilmemişse
      const existingCustomer = customersData.find(
        (customer) => 
          customer.phone === tourData.customerPhone || 
          customer.idNumber === tourData.customerIdNumber ||
          customer.email === tourData.customerEmail
      );

      if (!existingCustomer && tourData.customerName) {
        // Yeni müşteri bilgisi oluştur
        const newCustomer = {
          id: generateUUID(),
          name: tourData.customerName,
          phone: tourData.customerPhone,
          email: tourData.customerEmail,
          address: tourData.customerAddress,
          idNumber: tourData.customerIdNumber,
          citizenship: tourData.nationality, // Nationality bilgisini citizenship alanına kaydet
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Müşteriyi veritabanına ekle
        await addData("customers", newCustomer);
        setCustomersData([...customersData, newCustomer]);
        
        toast({
          title: "Bilgi",
          description: "Yeni müşteri kaydı otomatik olarak oluşturuldu.",
        });
      }

      // Ek katılımcıları kaydetme işlemi kaldırıldı
      // Kullanıcı isteğine göre sadece ana müşteri kaydedilecek, ek katılımcılar müşteriler kısmına kaydedilmeyecek
      // Ek katılımcılar sadece tur kaydında tutulacak ve tur ön izlemesinde görüntülenecek

      // Sonra tur kaydını kaydet
      if (tourData.id && toursData.some((tour) => tour.id === tourData.id)) {
        // Mevcut turu güncelle
        await updateData("tours", tourData)
        setToursData(toursData.map((tour) => (tour.id === tourData.id ? tourData : tour)))

        // Tur tamamlandıysa giderleri finansal kayıtlara ekle
        if (tourData.paymentStatus === "completed" && tourData.expenses && tourData.expenses.length > 0) {
          await addTourExpensesToFinancials(tourData);
        }
      } else {
        // Yeni tur ekle
        await addData("tours", tourData)
        setToursData([...toursData, tourData])

        // Tur tamamlandıysa giderleri finansal kayıtlara ekle
        if (tourData.paymentStatus === "completed" && tourData.expenses && tourData.expenses.length > 0) {
          await addTourExpensesToFinancials(tourData);
        }
      }

      toast({
        title: "Başarılı!",
        description: "Tur satışı başarıyla kaydedildi.",
      })

      // Clear temp form data after successful save
      setTempTourFormData(null)
      localStorage.removeItem("returnToTourSales")

      // Navigate to dashboard
      navigateTo("main-dashboard")
    } catch (error) {
      console.error("Tur kaydetme hatası:", error)
      toast({
        title: "Hata",
        description: "Tur satışı kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleSaveFinancial = async (data: FinancialData) => {
    try {
      if (data.id && financialData.some((item) => item.id === data.id)) {
        // Mevcut finansal kaydı güncelle
        await updateData("financials", data)
        setFinancialData(financialData.map((item) => (item.id === data.id ? data : item)))
      } else {
        // Yeni finansal kayıt ekle
        await addData("financials", data)
        setFinancialData([...financialData, data])
      }

      toast({
        title: "Başarılı!",
        description: "Finansal kayıt başarıyla kaydedildi.",
      })
      // Artık ana sayfaya yönlendirme yapılmıyor, kullanıcı formda kalmaya devam eder.
    } catch (error) {
      console.error("Finansal kayıt hatası:", error)
      toast({
        title: "Hata",
        description: "Finansal kayıt kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleSaveCustomer = async (data: CustomerData) => {
    try {
      if (data.id && customersData.some((item) => item.id === data.id)) {
        // Mevcut müşteri kaydını güncelle
        await updateData("customers", data)
        setCustomersData(customersData.map((item) => (item.id === data.id ? data : item)))
      } else {
        // Yeni müşteri kaydı ekle
        await addData("customers", data)
        setCustomersData([...customersData, data])
      }

      toast({
        title: "Başarılı!",
        description: "Müşteri kaydı başarıyla kaydedildi.",
      })

      navigateTo("main-dashboard")
    } catch (error) {
      console.error("Müşteri kayıt hatası:", error)
      toast({
        title: "Hata",
        description: "Müşteri kaydı kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  // Store the type of record being edited so we know where to navigate after editingRecord is set
  const [pendingEditType, setPendingEditType] = useState<string | null>(null);

  const handleEditRecord = (type: string, record: any) => {
    console.log("Düzenleme kaydı:", type, record);
    const recordCopy = JSON.parse(JSON.stringify(record));
    setEditingRecord(recordCopy);
    setPendingEditType(type);
  };

  // Effect: When editingRecord and pendingEditType are set, navigate to the correct form
  useEffect(() => {
    if (editingRecord && pendingEditType) {
      if (pendingEditType === "tours") {
        console.log("Tur düzenleme verileri:", editingRecord);
        navigateTo("tour-sales");
      } else if (pendingEditType === "financial") {
        console.log("Finansal düzenleme verileri:", editingRecord);
        navigateTo("financial-entry");
      } else if (pendingEditType === "customers") {
        console.log("Müşteri düzenleme verileri:", editingRecord);
        navigateTo("customers");
      }
      setPendingEditType(null); // Reset after navigation
    }
  }, [editingRecord, pendingEditType]);

  // Function to temporarily store tour form data
  const handleStoreTourFormData = (formData: any) => {
    setTempTourFormData(formData)
  }

  // Function to return from settings to tour form
  const handleReturnFromSettings = () => {
    if (localStorage.getItem("returnToTourSales") === "true") {
      localStorage.removeItem("returnToTourSales")
      navigateTo("tour-sales")
    } else {
      navigateTo("main-dashboard")
    }
  }

  const handleExportData = async () => {
    try {
      const success = await exportData()
      if (success) {
        toast({
          title: "Başarılı!",
          description: "Veriler başarıyla dışa aktarıldı.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Veriler dışa aktarılırken bir hata oluştu: " + error.message,
        variant: "destructive",
      })
    }
  }

  const handleImportData = async () => {
    try {
      await importData()
      toast({
        title: "Başarılı!",
        description: "Veriler başarıyla içe aktarıldı.",
      })
      // Sayfayı yenile
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Veriler içe aktarılırken bir hata oluştu: " + error.message,
        variant: "destructive",
      })
    }
  }

  // Splash screen göster
  if (currentView === "splash") {
    return <SplashScreen onFinish={handleSplashFinish} />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar currentView={currentView} onNavigate={navigateTo} />
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1">
          <Toaster />
          {/* Ana içerik */}
          {currentView === "main-dashboard" && (
            <MainDashboard
              onNavigate={navigateTo}
              financialData={financialData}
              toursData={toursData}
              customersData={customersData}
            />
          )}
          {currentView === "financial-entry" && (
            <FinancialEntryForm
              initialData={editingRecord}
              onSave={(newEntry: FinancialData) => {
                // Yeni finansal kaydı ekle veya düzenle
                const updatedData = editingRecord
                  ? financialData.map(item => item.id === newEntry.id ? newEntry : item)
                  : [...financialData, newEntry];
                handleDataUpdate("financial", updatedData);
                setEditingRecord(null);
                // navigateTo("main-dashboard"); // Yönlendirme kaldırıldı, formda kalınacak
              }}
              onCancel={() => { setEditingRecord(null); navigateTo("main-dashboard"); }}
            />
          )}
          {currentView === "tour-sales" && (
            <TourSalesForm
              initialData={editingRecord}
              onSave={handleSaveTour}
              onCancel={() => { setEditingRecord(null); navigateTo("main-dashboard"); }}
              toursData={toursData}
              onUpdateData={(data: TourData[]) => handleDataUpdate("tours", data)}
              onNavigate={navigateTo}
              editingRecord={editingRecord}
              setEditingRecord={setEditingRecord}
              customersData={customersData}
              setCustomersData={setCustomersData}
              tempTourFormData={tempTourFormData}
              setTempTourFormData={setTempTourFormData}
            />
          )}
          {currentView === "data-view" && (
            <DataView
              financialData={financialData}
              toursData={toursData}
              customersData={customersData}
              onDataUpdate={handleDataUpdate}
              onEdit={(type, item) => {
                setEditingRecord(item);
                if (type === "financial") navigateTo("financial-entry");
                else if (type === "tours") navigateTo("tour-sales");
                else if (type === "customers") navigateTo("customers");
              }}
              onClose={() => navigateTo("main-dashboard")}
            />
          )}
          {currentView === "calendar" && (
            <CalendarView
              toursData={toursData.map(tour => {
                // Güvenli tip dönüşümü için
                const totalPriceValue = typeof tour.totalPrice === 'string' 
                  ? parseFloat(tour.totalPrice) 
                  : (tour.totalPrice || 0);
                  
                return {
                  id: tour.id,
                  date: new Date(tour.tourDate),
                  title: `#${tour.serialNumber || '----'} | ${tour.customerName || 'İsimsiz'} (${tour.numberOfPeople || 0} Kişi)`,
                  customers: `${tour.numberOfPeople || 0} Kişi`,
                  color: '#4f46e5',
                  location: tour.tourName || 'Belirtilmemiş',
                  time: new Date(tour.tourDate).getHours() + ':00',
                  tourName: tour.tourName,
                  customerName: tour.customerName,
                  totalPrice: totalPriceValue,
                  currency: tour.currency,
                  serialNumber: tour.serialNumber
                };
              })}
              onNavigate={navigateTo}
            />
          )}
          {currentView === "customers" && (
            <CustomerView
              customersData={customersData}
              onUpdateData={(data: CustomerData[]) => handleDataUpdate("customers", data)}
              onNavigate={navigateTo}
              editingRecord={editingRecord}
              setEditingRecord={setEditingRecord}
            />
          )}
          {currentView === "analytics" && (
            <EnhancedAnalyticsView
              financialData={financialData.map(item => {
                // String tarihleri doğru formata dönüştürme
                const processedDate = typeof item.date === 'string' ? item.date : item.date.toISOString();
                return {
                  ...item,
                  date: processedDate
                };
              })}
              toursData={toursData.map(tour => {
                // String veya Date türündeki tourDate değerini uygun string formatına dönüştürme
                const processedTourDate = typeof tour.tourDate === 'string' ? tour.tourDate : tour.tourDate.toISOString();
                const processedTourEndDate = tour.tourEndDate 
                  ? (typeof tour.tourEndDate === 'string' ? tour.tourEndDate : tour.tourEndDate.toISOString())
                  : undefined;
                
                return {
                  ...tour,
                  tourDate: processedTourDate,
                  tourEndDate: processedTourEndDate
                };
              })}
              customersData={customersData}
              onNavigate={navigateTo}
            />
          )}
          {currentView === "backup-restore" && (
            <BackupRestoreView
              onClose={() => navigateTo("main-dashboard")}
              onExport={handleExportData}
              onImport={handleImportData}
            />
          )}
          {currentView === "settings" && (
            <SettingsView
              financialData={financialData}
              toursData={toursData}
              customersData={customersData}
              onUpdateData={handleDataUpdate}
              onNavigate={navigateTo}
              onClose={handleReturnFromSettings}
            />
          )}
          {currentView === "currency" && (
            <CurrencyPage />
          )}
        </div>
        <footer className="py-4 px-6 text-center text-muted-foreground border-t bg-white">
          <p>&copy; {new Date().getFullYear()} PassionisTravel Yönetim Sistemi. Tüm hakları saklıdır.</p>
        </footer>
      </div>
    </div>
  );
}

