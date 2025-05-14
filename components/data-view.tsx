"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DateRange } from "react-day-picker"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Edit, Trash2, Eye, Printer } from "lucide-react"
import { formatCurrency, formatCurrencyGroups, formatDate } from "@/lib/data-utils"
import { deleteData } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"

// Type definitions
interface TourActivity {
  name: string
  date?: string | Date
  duration?: string
  price: number | string
  currency?: string
  participants?: string | number
  participantsType?: string
}

interface TourAdditionalCustomer {
  name?: string
  phone?: string
  email?: string
  idNumber?: string
}

interface TourExpense {
  id: string;
  type: string;
  name: string;
  amount: string | number;
  currency: string;
  details?: string;
  isIncludedInPrice?: boolean;
  rehberInfo?: string;
  transferType?: string;
  transferPerson?: string;
  acentaName?: string;
  provider?: string;
  description?: string;
  date?: string | Date;
  category?: string;
}

export interface TourData {
  destination?: string // EKLENDİ: Tur destinasyonu
  nationality?: string // EKLENDİ: Müşteri vatandaşlık bilgisi
  destinationName?: string // EKLENDİ: Destinasyon adı

  id: string
  serialNumber?: string
  tourName?: string
  tourDate: string | Date
  tourEndDate?: string | Date
  numberOfPeople?: number
  numberOfChildren?: number
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  customerIdNumber?: string
  customerTC?: string
  customerPassport?: string
  customerDrivingLicense?: string
  pricePerPerson?: number | string
  totalPrice?: number | string
  currency?: string
  paymentStatus?: string
  paymentMethod?: string
  partialPaymentAmount?: number | string
  partialPaymentCurrency?: string
  notes?: string
  activities?: TourActivity[]
  companyName?: string
  additionalCustomers?: TourAdditionalCustomer[]
  expenses?: TourExpense[]
}

export interface FinancialData {
  id: string
  date: string | Date
  type: string
  category?: string
  description?: string
  amount?: number
  currency?: string
  paymentMethod?: string
  relatedTourId?: string // EKLENDİ: Tur ile ilişkilendirme
}

export interface CustomerData {
  id: string
  name?: string
  phone?: string
  email?: string
  idNumber?: string
  citizenship?: string // Vatandaşlık/Ülke alanı eklenmiştir
  address?: string // EKLENDİ: Adres alanı
}

interface DataViewProps {
  financialData: FinancialData[]
  toursData: TourData[]
  customersData: CustomerData[]
  onClose: () => void
  onDataUpdate: (type: string, data: any) => void
  onEdit: (type: string, item: any) => void
}

interface DeleteItem {
  type: string
  id: string
}

export function DataView({ 
  financialData = [], 
  toursData = [], 
  customersData = [], 
  onClose, 
  onDataUpdate, 
  onEdit 
}: DataViewProps) {
  const { toast } = useToast();
  // Para birimi seçimi için state
  const [selectedCurrency, setSelectedCurrency] = useState<string>("all");
  // Diğer özet veriler için state'ler (boş başlatılıyor)
  const [nationalityData, setNationalityData] = useState<any[]>([]);
  const [referralSourceData, setReferralSourceData] = useState<any[]>([]);
  const [toursByDestination, setToursByDestination] = useState<any[]>([]);
  const [toursByMonth, setToursByMonth] = useState<any[]>([]);
  const [currencySummaries, setCurrencySummaries] = useState<any>({});
  const [activeTab, setActiveTab] = useState("tours")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTour, setSelectedTour] = useState<TourData | null>(null)
  const [selectedFinancial, setSelectedFinancial] = useState<FinancialData | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<DeleteItem>({ type: "", id: "" })
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [destinations, setDestinations] = useState<any[]>([]);
  // Tarih filtresinin aktif olup olmadığını kontrol eden state
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);

  // Komponent yüklendiğinde destinasyon verilerini al
  useEffect(() => {
    // Önce localStorage'dan destinasyon verilerini almayı dene
    try {
      const savedDestinations = localStorage.getItem('destinations');
      if (savedDestinations) {
        setDestinations(JSON.parse(savedDestinations));
      } else {
        // localStorage'da yok ise, sample-destinations.json dosyasını yükle
        fetch('/data/sample-destinations.json')
          .then(response => response.json())
          .then(data => {
            setDestinations(data);
            // localStorage'a kaydet
            localStorage.setItem('destinations', JSON.stringify(data));
          })
          .catch(error => console.error("Destinasyon verileri yüklenirken hata oluştu:", error));
      }
    } catch (e) {
      console.error("Destinasyon verilerini işlerken hata:", e);
    }
  }, []);

  const handleDelete = async () => {
    try {
      if (itemToDelete.type === "financial") {
        // First delete from IndexedDB
        await deleteData("financials", itemToDelete.id);
        console.log("Financial data deleted from IndexedDB:", itemToDelete.id);
        
        // Then update UI state
        const updatedData = financialData.filter((item: FinancialData) => item.id !== itemToDelete.id);
        console.log("Remaining financial data count:", updatedData.length);
        
        // Update both state and localStorage
        onDataUpdate("financial", updatedData);
      } else if (itemToDelete.type === "tours") {
        // First delete from IndexedDB
        await deleteData("tours", itemToDelete.id);
        console.log("Tour data deleted from IndexedDB:", itemToDelete.id);
        
        // Then update UI state
        const updatedData = toursData.filter((item: TourData) => item.id !== itemToDelete.id);
        console.log("Remaining tour data count:", updatedData.length);
        
        // Update both state and localStorage
        onDataUpdate("tours", updatedData);
      } else if (itemToDelete.type === "customers") {
        // First delete from IndexedDB
        await deleteData("customers", itemToDelete.id);
        console.log("Customer data deleted from IndexedDB:", itemToDelete.id);
        
        // Then update UI state
        const updatedData = customersData.filter((item: CustomerData) => item.id !== itemToDelete.id);
        console.log("Remaining customer count:", updatedData.length);
        
        // Update both state and localStorage
        onDataUpdate("customers", updatedData);
      }
      
      // Deletion completed
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error during deletion:", error);
      alert("An error occurred while deleting the record! Please try again.");
      setIsDeleteDialogOpen(false);
    }
  }

  const openDeleteDialog = (type: string, id: string) => {
    setItemToDelete({ type, id })
    setIsDeleteDialogOpen(true)
  }

  const handleEdit = (type: string, item: any) => {
    onEdit(type, item)
  }

  // Function for printing tour details
  const handlePrint = (tour: TourData) => {
    try {
      // Save tour data to localStorage
      try {
        localStorage.removeItem('printTourData'); // Clear old data first
        localStorage.setItem('printTourData', JSON.stringify(tour));
        console.log('Data to be printed saved:', tour);
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
        alert('An error occurred while saving data for printing. Please try again.');
        return;
      }
      
      // Open a new window and redirect to print page
      const printWindow = window.open(`/print/tour/${tour.id}`, '_blank');
      
      if (!printWindow) {
        alert('Could not open print window. Please check your popup blocker.');
      }
    } catch (error) {
      console.error('Error during print operation:', error);
      alert('An error occurred during the print operation. Please try again.');
    }
  }
  
  // İşlevsiz yazdır butonlarını kaldırıyoruz
  // PrintButton fonksiyonları silindi
  
  // Tarih kontrolü yardımcı fonksiyonu - tarih, belirtilen aralıkta mı?
  const isDateInRange = (date: string | Date | undefined, range: DateRange | undefined): boolean => {
    if (!range || !date) return true; // Tarih aralığı belirtilmemişse veya tarih yoksa filtreleme yapma
    
    const checkDate = new Date(date);
    
    // Başlangıç tarihi kontrolü
    if (range.from) {
      const fromDate = new Date(range.from);
      fromDate.setHours(0, 0, 0, 0);
      if (checkDate < fromDate) return false;
    }
    
    // Bitiş tarihi kontrolü
    if (range.to) {
      const toDate = new Date(range.to);
      toDate.setHours(23, 59, 59, 999);
      if (checkDate > toDate) return false;
    }
    
    return true;
  };
  
  const filteredToursData = toursData.filter(
    (item: TourData) => {
      // Tarih aralığı kontrolü - sadece tarih filtresi etkinleştirilmişse çalıştır
      if (dateFilterEnabled && dateRange && !isDateInRange(item.tourDate, dateRange)) {
        return false;
      }
      
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      
      // Tur adı yerine müşteri adı olarak değiştiriliyor
      return (
        (item.customerName?.toLowerCase().includes(searchLower) || '') ||
        (item.tourName?.toLowerCase().includes(searchLower) || '') || // Tur adı da aranabilsin
        (item.serialNumber?.toLowerCase().includes(searchLower) || '') ||
        // "F" olmadan seri numarasını arama
        (item.serialNumber && searchLower.startsWith("f") && 
          item.serialNumber.toLowerCase().includes(searchLower.substring(1)))
      );
    }
  )

  const filteredFinancialData = (() => {
    // Önce tüm işlem numaralarını sabit bir şekilde oluştur (filtrelemeden önce)
    let incomeCounter = 1;
    let expenseCounter = 1;
    
    // Tüm finansal kayıtların işlem numaralarını önceden hesapla
    const financialWithSerialNumbers = financialData.map(item => {
      let serialNumber = "";
      let displayDate = item.date;
      let displayDescription = item.description || '-';
      let tourCustomerName = "";
      let tourSerialNumber = ""; // Tur seri numarası - sıralama için
      let sortPriority = 0; // Sıralama önceliği
      
      if (item.relatedTourId && item.category === "Tur Gideri") {
        const tourInfo = toursData.find(t => t.id === item.relatedTourId);
        if (tourInfo) {
          const numericPart = tourInfo.serialNumber || tourInfo.id?.slice(-4) || "";
          serialNumber = `${numericPart}TF`; // Önce numara, sonra TF
          tourCustomerName = tourInfo.customerName || "";
          tourSerialNumber = tourInfo.serialNumber || ""; // Sıralama için tur seri numarası sakla
          // Tur tarihini kullanarak bir sıralama önceliği ata - aynı tur için birlikte göster
          displayDate = tourInfo.tourDate; // Tur tarihini kullan
          
          const expenseType = item.description?.split(' - ')[1] || "Gider";
          displayDescription = `${tourInfo.customerName || "Müşteri"} - ${expenseType}`;
        } else {
          serialNumber = `${expenseCounter++}TF`; // Önce numara, sonra TF
        }
      } else {
        // Normal finans kaydı için gelir veya gidere göre sıralı numara ata
        if (item.type === 'income') {
          serialNumber = `${incomeCounter++}F`; // Önce numara, sonra F
          sortPriority = 1; // Gelirler için öncelik
        } else {
          serialNumber = `${expenseCounter++}F`; // Önce numara, sonra F
          sortPriority = 2; // Normal giderler için öncelik
        }
      }
      
      return {
        ...item,
        _serialNumber: serialNumber,  // Önceden hesaplanmış işlem numarası
        _displayDate: displayDate,
        _displayDescription: displayDescription,
        _tourCustomerName: tourCustomerName,
        _tourSerialNumber: tourSerialNumber, // Tur seri numarası - sıralama için
        _sortPriority: sortPriority // Sıralama önceliği
      };
    });

    // Tarih aralığına göre filtrele - sadece tarih filtresi etkinleştirilmişse
    const dateFiltered = financialWithSerialNumbers.filter(item => {
      // Tarih filtresi etkin değilse tüm kayıtları göster
      if (!dateFilterEnabled) return true;
      // Filtre etkinse ve tarih aralığı seçiliyse, tarihi kontrol et
      return isDateInRange(item.date, dateRange);
    });

    // Arama terimine göre filtrele    
    if (!searchTerm) return dateFiltered;
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    const filteredItems = dateFiltered.filter(item => {
      // Sabit numarayı kullan
      const serialNumber = item._serialNumber;
      
      // Farklı formatlarda aranabilen işlem numarası kontrolü - yeni formata göre (önce sayı sonra harf)
      // 3F veya 3 gibi aramalarda hem tam metin hem de sayı olarak kontrolü yap
      const serialNumberLC = serialNumber.toLowerCase();
      
      // Sadece sayılar
      const searchNumberOnly = searchLower.replace(/\D/g, ''); 
      const serialNumberOnly = serialNumberLC.replace(/\D/g, '');
      
      // Sadece harfler
      const searchLettersOnly = searchLower.replace(/\d/g, '').trim();
      const serialLettersOnly = serialNumberLC.replace(/\d/g, '').trim();
      
      const isSerialMatch = 
        serialNumberLC === searchLower || // Tam eşleşme (123F)
        serialNumberOnly === searchLower || // Kullanıcı sadece sayı kısmını arıyor (123)
        serialLettersOnly === searchLower || // Kullanıcı sadece harf kısmını arıyor (F veya TF)
        serialNumberLC.includes(searchLower) || // İşlem no içinde arama
        searchLower.includes(serialNumberOnly) || // Aranan metin sayı içeriyor
        serialNumberOnly === searchNumberOnly; // Sadece sayı karşılaştırması
      
      // Tanımların ayrılması
      let expenseType = "";
      if (item.description && item.description.includes(" - ")) {
        const parts = item.description.split(" - ");
        expenseType = parts[1] || "";
      }
      
      return (
        isSerialMatch || // İşlem numarası eşleşmesi
        (item.description?.toLowerCase().includes(searchLower) || '') || // Açıklama eşleşmesi
        (item.category?.toLowerCase().includes(searchLower) || '') || // Kategori eşleşmesi
        (item.type.toLowerCase().includes(searchLower)) || // Tür eşleşmesi
        (item._tourCustomerName.toLowerCase().includes(searchLower)) || // Müşteri adı eşleşmesi
        (expenseType.toLowerCase().includes(searchLower)) // Gider türü eşleşmesi
      );
    });
    
    // Geliştirilmiş gruplama algoritması - Turlar ve Tur Giderleri için daha iyi organizasyon
    const grouped = filteredItems.reduce((acc, item) => {
      // Tur giderlerini ayır
      if (item.category === "Tur Gideri" && item.relatedTourId) {
        // Tarih tabanlı grupler oluştur (önce aynı tarihteki kayıtları bir araya getir)
        const dateStr = new Date(item._displayDate || item.date).toISOString().split('T')[0];
        const groupKey = `${dateStr}:${item.relatedTourId}`;
        
        // Her tarih+tur kombinasyonu için grup oluştur
        if (!acc.tourGroups[groupKey]) {
          acc.tourGroups[groupKey] = [];
        }
        acc.tourGroups[groupKey].push(item);
      } else {
        // Gelir ve giderleri ayrı listelere ayır (sıralama için)
        if (item.type === 'income') {
          acc.incomeItems.push(item);
        } else {
          acc.expenseItems.push(item);
        }
      }
      return acc;
    }, { tourGroups: {}, incomeItems: [], expenseItems: [] });
    
    // Her grup kendi içinde seri numarası ve tarihine göre sıralansın
    Object.values(grouped.tourGroups).forEach(group => {
      (group as any[]).sort((a, b) => {
        // Önce sayısal kısımlarına göre sırala
        const aNum = parseInt(a._serialNumber.replace(/[^\d]/g, '') || '0');
        const bNum = parseInt(b._serialNumber.replace(/[^\d]/g, '') || '0');
        if (aNum !== bNum) {
          return aNum - bNum;
        }
        
        // Aynı sayı ise tarihe göre sırala (artan sırada)
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    });
    
    // Gelir ve giderler için kendi içinde sıralama yap
    const sortBySerialNumber = (a: any, b: any) => {
      const aNum = parseInt(a._serialNumber.replace(/[^\d]/g, '') || '0');
      const bNum = parseInt(b._serialNumber.replace(/[^\d]/g, '') || '0');
      return aNum - bNum;
    };
    
    grouped.incomeItems.sort(sortBySerialNumber);
    grouped.expenseItems.sort(sortBySerialNumber);
    
    // Düzenli gruplanmış sonuç listesini tarih ve seri numarası bazlı oluştur
    const result = [
      // Önce gelir kayıtları
      ...grouped.incomeItems,
      // Sonra normal gider kayıtları
      ...grouped.expenseItems,
      // En son gruplandırılmış tur giderleri (düzleştirilmiş)
      ...Object.values(grouped.tourGroups).flat()
    ];
    
    // Son global sıralama tamamen yeniden yazıldı
    return result.sort((a, b) => {
      // Öncelikle tur giderlerini kendi içinde gruplayalım
      const aIsTourExpense = a.category === "Tur Gideri" && a.relatedTourId;
      const bIsTourExpense = b.category === "Tur Gideri" && b.relatedTourId;
      
      // Eğer aynı tura ait iki kayıt varsa onları bir arada tutalım
      if (aIsTourExpense && bIsTourExpense && a.relatedTourId === b.relatedTourId) {
        // 1. Aynı tura aitse, seri numaralarının yalnızca sayısal kısmını karşılaştır
        const aNumericPart = parseInt(a._serialNumber.replace(/[^\d]/g, '') || '0');
        const bNumericPart = parseInt(b._serialNumber.replace(/[^\d]/g, '') || '0');
        return aNumericPart - bNumericPart;
      }
      
      // 2. Farklı tarihler varsa tarih öncelikli sırala (en yeniden en eskiye)
      const dateA = new Date(a._displayDate || a.date);
      const dateB = new Date(b._displayDate || b.date);
      const dateDiff = dateB.getTime() - dateA.getTime();
      
      if (dateDiff !== 0) return dateDiff;
      
      // 3. Tur giderlerini önce göster
      if (aIsTourExpense && !bIsTourExpense) return -1;
      if (!aIsTourExpense && bIsTourExpense) return 1;
      
      // 4. Eğer her ikisi de aynı kategorideyse (gelir/gider) sayısal sıralama yap
      if (a.type === b.type) {
        // Sayısal sıralama için numara kısmını ayıkla 
        const aNum = parseInt(a._serialNumber.replace(/[^\d]/g, '') || '0');
        const bNum = parseInt(b._serialNumber.replace(/[^\d]/g, '') || '0');
        return aNum - bNum;
      }
      
      // 5. Gelirler giderlerden önce gelsin
      return a.type === 'income' ? -1 : 1;
    });
  })();

  const filteredCustomersData = customersData
    .filter((item: CustomerData) => {
      // Not: Müşteri kayıtlarında doğrudan tarih alanı olmayabilir,
      // Bu nedenle müşterilerin bu tarih filtrelerinden etkilenmeyebilir
      // veya burada başka bir tarih alanı kullanılabilir

      // Eğer arama terimi yoksa tüm müşterileri göster
      if (!searchTerm) return true;
      
      // Arama terimine göre filtrele
      const searchLower = searchTerm.toLowerCase();
      return (
        (item.name?.toLowerCase().includes(searchLower) || '') ||
        (item.phone?.toLowerCase().includes(searchLower) || '') ||
        (item.email?.toLowerCase().includes(searchLower) || '') ||
        (item.citizenship?.toLowerCase().includes(searchLower) || '') ||
        (item.idNumber?.toLowerCase().includes(searchLower) || '')
      );
    });

  // Tour Preview Component
  const TourPreview = ({ tour }: { tour: TourData | null }) => {
    if (!tour) return null;

    // TourSummary ile aynı alanları ve kart yapısını kullan
    // Alanları normalize et
    const additionalCustomers = tour.additionalCustomers || [];
    const expenses = tour.expenses || [];
    const activities = tour.activities || [];
    const numberOfPeople = tour.numberOfPeople || 0;
    const numberOfChildren = tour.numberOfChildren || 0;
    const pricePerPerson = tour.pricePerPerson || 0;
    const currency = tour.currency || "";
    const totalPrice = tour.totalPrice || (Number(pricePerPerson) * Number(numberOfPeople));
    const paymentStatus = tour.paymentStatus || "";
    const paymentMethod = tour.paymentMethod || "";
    const partialPaymentAmount = tour.partialPaymentAmount || "";
    const partialPaymentCurrency = tour.partialPaymentCurrency || "";
    const notes = tour.notes || "";
    const destinationName = tour.destinationName || tour.destination || "-";
    // Fallback: selectedTourName -> tourName -> description -> notes -> "-"
    const selectedTourName = (tour as any).selectedTourName || tour.tourName || (tour as any).description || (tour as any).notes || "-";
    // Fallback: customerAddress -> "adres" -> "-"
    const customerAddress = (tour as any).customerAddress || (tour as any).adres || "-";
    // Fallback: referralSource -> "nereden" -> "-"
    const referralSource = (tour as any).referralSource || (tour as any).nereden || "-";

    // Ödeme durumları ve yöntemleri
    const paymentStatusMap: Record<string, string> = {
      pending: "Beklemede",
      partial: "Kısmi Ödeme",
      completed: "Tamamlandı",
      refunded: "İade Edildi",
    };
    const paymentMethodMap: Record<string, string> = {
      cash: "Nakit",
      creditCard: "Kredi Kartı",
      bankTransfer: "Banka Transferi",
      online_payment: "Online Ödeme",
      other: "Diğer",
    };

    // Gider kategori türleri için dönüşüm haritası
    const expenseTypeMap: Record<string, string> = {
      accommodation: "Konaklama",
      transportation: "Ulaşım",
      transfer: "Transfer",
      guide: "Rehberlik",
      agency: "Acente",
      porter: "Hanutçu",
      food: "Yemek",
      meal: "Yemek",
      activity: "Aktivite",
      general: "Genel",
      other: "Diğer"
    };

    // Aktivite adı eksikse, activityId ile bul
    const getActivityName = (activity: any) => {
      if (activity.name && activity.name !== "") return activity.name;
      if (activity.activityId && Array.isArray(activities)) {
        const found = activities.find((a: any) => a.id === activity.activityId);
        if (found && found.name) return found.name;
      }
      return "-";
    };

    // Tur fiyatı (kişi başı fiyat * kişi sayısı) kendi para biriminde
    const tourTotals: Record<string, number> = {};
    if (currency && Number(pricePerPerson) && Number(numberOfPeople)) {
      tourTotals[currency] = (Number(pricePerPerson) || 0) * (Number(numberOfPeople) || 0);
    }
    // Aktivite toplamları (her biri kendi para biriminde)
    const activityTotals: Record<string, number> = {};
    activities.forEach((activity) => {
      const cur = activity.currency || currency || "TRY";
      let participantCount = 0;
      if (activity.participantsType === 'all') {
        participantCount = Number(numberOfPeople) + Number(numberOfChildren);
      } else if (activity.participants && Number(activity.participants) > 0) {
        participantCount = Number(activity.participants);
      }
      const toplam = (Number(activity.price) || 0) * participantCount;
      if (!activityTotals[cur]) activityTotals[cur] = 0;
      activityTotals[cur] += toplam;
    });
    // Tüm toplamları birleştir
    const allTotals: Record<string, number> = { ...tourTotals };
    for (const cur in activityTotals) {
      allTotals[cur] = (allTotals[cur] || 0) + activityTotals[cur];
    }
    // Toplamları string olarak hazırla
    const totalString = Object.entries(allTotals)
      .filter(([_, val]) => val > 0)
      .map(([cur, val]) => `${val} ${cur}`)
      .join(" + ") || "-";

    // Referans kaynakları için harita (step 6 ile uyumlu)
    const referralSourceMap: Record<string, string> = {
      website: "İnternet Sitesi",
      hotel: "Otel Yönlendirmesi",
      local_guide: "Hanutçu / Yerel Rehber",
      walk_in: "Kapı Önü Müşterisi",
      repeat: "Tekrar Gelen Müşteri",
      recommendation: "Tavsiye",
      social_media: "Sosyal Medya",
      other: "Diğer",
    };

    return (
      <div className="space-y-4 max-h-[80vh] overflow-y-auto p-2 min-w-[700px]">
        {/* 1. Müşteri Bilgileri */}
        <Card>
          <CardHeader className="pb-2 pt-2 mb-0 mt-0"><CardTitle>Müşteri Bilgileri</CardTitle></CardHeader>
          <CardContent className="pt-2 pb-2 mb-0 mt-0">
            <Table>
              <TableBody>
                <TableRow><TableHead>Ad Soyad</TableHead><TableCell>{tour.customerName || '-'}</TableCell></TableRow>
                <TableRow><TableHead>Telefon</TableHead><TableCell>{tour.customerPhone || '-'}</TableCell></TableRow>
                <TableRow><TableHead>E-posta</TableHead><TableCell>{tour.customerEmail || '-'}</TableCell></TableRow>
                <TableRow><TableHead>T.C./Pasaport No</TableHead><TableCell>{tour.customerIdNumber || '-'}</TableCell></TableRow>
                <TableRow><TableHead>Adres</TableHead><TableCell>{customerAddress}</TableCell></TableRow>
                <TableRow><TableHead>Uyruk</TableHead><TableCell>{tour.nationality || '-'}</TableCell></TableRow>
                <TableRow><TableHead>Referans Kaynağı</TableHead><TableCell>{referralSourceMap[referralSource] || referralSource || '-'}</TableCell></TableRow>
              </TableBody>
            </Table>
            {additionalCustomers.length > 0 && (
              <div className="mt-2 mb-0">
                <span className="font-semibold">Ek Katılımcılar:</span>
                <Table className="mt-1 mb-0">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ad Soyad</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>E-posta</TableHead>
                      <TableHead>T.C./Pasaport No</TableHead>
                      <TableHead>Adres</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {additionalCustomers.map((c: any, idx: number) => (
                      <TableRow key={idx} className="h-8">
                        <TableCell className="py-1 px-2">{c.name || '-'}</TableCell>
                        <TableCell className="py-1 px-2">{c.phone || '-'}</TableCell>
                        <TableCell className="py-1 px-2">{c.email || '-'}</TableCell>
                        <TableCell className="py-1 px-2">{c.idNumber || '-'}</TableCell>
                        <TableCell className="py-1 px-2">{c.address || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Tur Detayları */}
        <Card>
          <CardHeader className="pb-2 pt-2 mb-0 mt-0"><CardTitle>Tur Detayları</CardTitle></CardHeader>
          <CardContent className="pt-2 pb-2 mb-0 mt-0">
            <Table>
              <TableBody>
                <TableRow><TableHead>Seri No</TableHead><TableCell>{tour.serialNumber || '-'}</TableCell></TableRow>
                <TableRow><TableHead>Tur Kaydını Oluşturan Kişi</TableHead><TableCell className="font-medium">{tour.tourName || '-'}</TableCell></TableRow>
                <TableRow><TableHead>Başlangıç Tarihi</TableHead><TableCell>{formatDate(tour.tourDate)}</TableCell></TableRow>
                <TableRow><TableHead>Bitiş Tarihi</TableHead><TableCell>{formatDate(tour.tourEndDate)}</TableCell></TableRow>
                <TableRow><TableHead>Kişi Sayısı</TableHead><TableCell>{numberOfPeople}</TableCell></TableRow>
                <TableRow><TableHead>Çocuk Sayısı</TableHead><TableCell>{numberOfChildren}</TableCell></TableRow>
                <TableRow><TableHead>Destinasyon</TableHead><TableCell className="font-medium">{destinationName}</TableCell></TableRow>
                <TableRow><TableHead>Tur Bilgisi</TableHead><TableCell className="font-medium">{selectedTourName}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 3. Giderler */}
        <Card>
          <CardHeader className="pb-2 pt-2 mb-0 mt-0"><CardTitle>Giderler</CardTitle></CardHeader>
          <CardContent className="pt-2 pb-2 mb-0 mt-0">
            {expenses.length === 0 ? (
              <div className="text-muted-foreground">Gider eklenmemiş.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="py-1 px-2">Gider Tipi</TableHead>
                      <TableHead className="py-1 px-2">Açıklama</TableHead>
                      <TableHead className="py-1 px-2">Tutar</TableHead>
                      <TableHead className="py-1 px-2">Para Birimi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense, idx) => (
                      <TableRow key={idx} className="h-8">
                        <TableCell className="py-1 px-2">{expenseTypeMap[expense.type] || expense.type}</TableCell>
                        <TableCell className="py-1 px-2">{expense.name}</TableCell>
                        <TableCell className="py-1 px-2">{expense.amount}</TableCell>
                        <TableCell className="py-1 px-2">{expense.currency}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>

        {/* 4. Aktiviteler */}
        <Card>
          <CardHeader className="pb-2 pt-2 mb-0 mt-0"><CardTitle>Aktiviteler</CardTitle></CardHeader>
          <CardContent className="pt-2 pb-2 mb-0 mt-0">
            {activities.length === 0 ? (
              <div className="text-muted-foreground">Aktivite eklenmemiş.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="py-1 px-2">Aktivite Adı</TableHead>
                    <TableHead className="py-1 px-2">Tarih</TableHead>
                    <TableHead className="py-1 px-2">Süre</TableHead>
                    <TableHead className="py-1 px-2">Katılımcı Sayısı</TableHead>
                    <TableHead className="py-1 px-2">Birim Ücret</TableHead>
                    <TableHead className="py-1 px-2">Toplam Ücret</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity, idx) => {
                    const price = activity.price ? Number(activity.price) : 0;
                    const currency = activity.currency || tour.currency || '';
                    let participants = '-';
                    let totalPrice = '-';
                    let participantCount = 0;
                    if (activity.participantsType === 'all') {
                      participantCount = Number(numberOfPeople) + Number(numberOfChildren);
                    } else if (activity.participants && Number(activity.participants) > 0) {
                      participantCount = Number(activity.participants);
                    }
                    if (participantCount > 0) {
                      participants = String(participantCount);
                      totalPrice = (price * participantCount).toLocaleString() + ' ' + currency;
                    } else {
                      totalPrice = price ? price.toLocaleString() + ' ' + currency : '-';
                    }
                    return (
                      <TableRow key={idx} className="h-8">
                        <TableCell className="py-1 px-2">{getActivityName(activity)}</TableCell>
                        <TableCell className="py-1 px-2">{formatDate(activity.date)}</TableCell>
                        <TableCell className="py-1 px-2">{activity.duration || '-'}</TableCell>
                        <TableCell className="py-1 px-2">{participants}</TableCell>
                        <TableCell className="py-1 px-2">{activity.price ? `${activity.price} ${currency}` : '-'}</TableCell>
                        <TableCell className="py-1 px-2">{totalPrice}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 5. Ödeme Bilgileri */}
        <Card>
          <CardHeader className="pb-2 pt-2 mb-0 mt-0"><CardTitle>Ödeme Bilgileri</CardTitle></CardHeader>
          <CardContent className="pt-2 pb-2 mb-0 mt-0">
            <Table>
              <TableBody>
                <TableRow><TableHead>Tur Fiyatı</TableHead><TableCell>{numberOfPeople && pricePerPerson ? Number(pricePerPerson) * Number(numberOfPeople) : '-'} {currency || ''}</TableCell></TableRow>
                {activities.length > 0 && (
                  <TableRow>
                    <TableHead>Aktiviteler</TableHead>
                    <TableCell>
                      {(() => {
                        // Aktivite toplamlarını doğru hesapla
                        const activityTotals: Record<string, number> = {};
                        activities.forEach((activity) => {
                          const cur = activity.currency || currency || 'TRY';
                          let participantCount = 0;
                          if (activity.participantsType === 'all') {
                            participantCount = Number(numberOfPeople) + Number(numberOfChildren);
                          } else if (activity.participants && Number(activity.participants) > 0) {
                            participantCount = Number(activity.participants);
                          }
                          const toplam = (Number(activity.price) || 0) * participantCount;
                          if (!activityTotals[cur]) activityTotals[cur] = 0;
                          activityTotals[cur] += toplam;
                        });
                        const formattedActivityTotals = Object.entries(activityTotals)
                          .filter(([_, val]) => val > 0)
                          .map(([cur, val]) => formatCurrency(val, cur))
                          .join(' + ');
                          
                      return formattedActivityTotals ? <span dangerouslySetInnerHTML={{ __html: formattedActivityTotals }} /> : '-';
                      })()}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow><TableHead>Toplam Fiyat</TableHead><TableCell>{(() => {
                  // Tur ve aktivitelerin toplamı
                  const tourTotals: Record<string, number> = {};
                  if (currency && Number(pricePerPerson) && Number(numberOfPeople)) {
                    tourTotals[currency] = (Number(pricePerPerson) || 0) * (Number(numberOfPeople) || 0);
                  }
                  const activityTotals: Record<string, number> = {};
                  activities.forEach((activity) => {
                    const cur = activity.currency || currency || 'TRY';
                    let participantCount = 0;
                    if (activity.participantsType === 'all') {
                      participantCount = Number(numberOfPeople) + Number(numberOfChildren);
                    } else if (activity.participants && Number(activity.participants) > 0) {
                      participantCount = Number(activity.participants);
                    }
                    const toplam = (Number(activity.price) || 0) * participantCount;
                    if (!activityTotals[cur]) activityTotals[cur] = 0;
                    activityTotals[cur] += toplam;
                  });
                  const allTotals: Record<string, number> = { ...tourTotals };
                  for (const cur in activityTotals) {
                    allTotals[cur] = (allTotals[cur] || 0) + activityTotals[cur];
                  }
                  const formattedTotals = Object.entries(allTotals)
                    .filter(([_, val]) => val > 0)
                    .map(([cur, val]) => formatCurrency(val, cur))
                    .join(' + ');
                  
                  return formattedTotals ? <span dangerouslySetInnerHTML={{ __html: formattedTotals }} /> : '-';
                })()}</TableCell></TableRow>
                <TableRow><TableHead>Ödeme Durumu</TableHead><TableCell>{paymentStatusMap[paymentStatus] || paymentStatus || '-'}</TableCell></TableRow>
                <TableRow><TableHead>Ödeme Yöntemi</TableHead><TableCell>{paymentMethodMap[paymentMethod] || paymentMethod || '-'}</TableCell></TableRow>
                <TableRow><TableHead>Kısmi Ödeme</TableHead><TableCell>
  {partialPaymentAmount ? (
    <span dangerouslySetInnerHTML={{ __html: formatCurrency(partialPaymentAmount, partialPaymentCurrency || 'TRY') }} />
  ) : '-'}
</TableCell></TableRow>
              </TableBody>
            </Table>
            {notes && (
              <div className="mt-1">
                <span className="font-semibold">Notlar:</span>
                <div className="whitespace-pre-line">{notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Financial Record Preview Component
  const FinancialPreview = ({ financial }: { financial: FinancialData | null }) => {
    if (!financial) return null;

    // İlgili turu bul
    const tourInfo = financial.relatedTourId ? toursData.find(t => t.id === financial.relatedTourId) : null;
    
    // Gerçek müşteri adını bul
    const customerName = tourInfo?.customerName || "-";
    
    // Gider açıklaması - sadece gider türünü al
    let expenseDesc = "-";
    if (financial.description) {
      const parts = financial.description.split(" - ");
      expenseDesc = parts.length > 1 ? parts[1].split("(")[0].trim() : financial.description;
    }
    
    // Seri numarası
    const serialNumber = tourInfo?.serialNumber || "-";

    // Destinasyon bilgisini bul
    const destinationName = tourInfo ? (tourInfo.destinationName || tourInfo.destination || "-") : "-";

    // Tur tarihi formatı: "başlangıç / bitiş" (eğer bitiş varsa)
    let tourDateFormatted = "-";
    if (tourInfo) {
      const startDate = formatDate(tourInfo.tourDate);
      
      if (tourInfo.tourEndDate) {
        const endDate = formatDate(tourInfo.tourEndDate);
        tourDateFormatted = `${startDate} / ${endDate}`;
      } else {
        tourDateFormatted = startDate;
      }
    }

    // Finansal kaydın türüne göre başlık belirle
    const getTitle = () => {
      if (financial.relatedTourId && financial.category === "Tur Gideri") {
        return "Finansal Kayıt Tur Gider Detayları";
      } else if (financial.type === "income") {
        return "Finansal Kayıt Gelir Detayları";
      } else {
        return "Finansal Kayıt Gider Detayları";
      }
    };

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
        <table className="w-full border-collapse border border-gray-300">
          <tbody>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 px-4 py-2 font-semibold w-1/4">Müşteri:</td>
              <td className="border border-gray-300 px-4 py-2">{customerName}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 font-semibold">Destinasyon:</td>
              <td className="border border-gray-300 px-4 py-2">{destinationName}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 px-4 py-2 font-semibold">İşlem Tarihi:</td>
              <td className="border border-gray-300 px-4 py-2">{formatDate(financial.date)}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 font-semibold">Tur Tarihi:</td>
              <td className="border border-gray-300 px-4 py-2">{tourDateFormatted}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 px-4 py-2 font-semibold">Kategori:</td>
              <td className="border border-gray-300 px-4 py-2">{financial.category || "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 font-semibold">Açıklama:</td>
              <td className="border border-gray-300 px-4 py-2">{expenseDesc}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 px-4 py-2 font-semibold">Nakit:</td>
              <td className="border border-gray-300 px-4 py-2">{financial.currency} {financial.amount?.toLocaleString() || "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 font-semibold">Seri No:</td>
              <td className="border border-gray-300 px-4 py-2">{serialNumber}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Customer Preview Component
  const CustomerPreview = ({ customer }: { customer: CustomerData | null }) => {
    if (!customer) return null

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Müşteri Bilgileri</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Ad Soyad:</span>
                <p>{customer.name || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Telefon:</span>
                <p>{customer.phone || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">E-posta:</span>
                <p>{customer.email || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">TC/Pasaport No:</span>
                <p>{customer.idNumber || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Vatandaşlık / Ülke:</span>
                <p>{customer.citizenship || '-'}</p>
              </div>
              {customer.address && (
                <div>
                  <span className="text-sm text-muted-foreground">Adres:</span>
                  <p>{customer.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <CardTitle className="text-xl">Veri Görünümü</CardTitle>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Ara..."
                  className="w-[200px] pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Müşteriler sekmesi hariç tarih filtresi göster */}
              {activeTab !== "customers" && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="dateFilterToggle"
                      checked={dateFilterEnabled}
                      onChange={(e) => setDateFilterEnabled(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="dateFilterToggle" className="text-sm whitespace-nowrap">
                      Tarih Filtresini Etkinleştir
                    </label>
                  </div>
                  
                  <DatePickerWithRange 
                    date={dateRange} 
                    setDate={setDateRange} 
                    className="w-[180px]"
                    placeholder="Tarih Aralığı Seçin"
                    disabled={!dateFilterEnabled}
                  />
                </div>
              )}
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tours" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tours">Turlar</TabsTrigger>
            <TabsTrigger value="financial">Finansal Kayıtlar</TabsTrigger>
            <TabsTrigger value="customers">Müşteriler</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tours">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seri No</TableHead>
                    <TableHead>Tur Kaydını Oluşturan Kişi</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Destinasyon</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredToursData.length > 0 ? (
                    filteredToursData.map((tour) => (
                      <TableRow key={tour.id}>
                        <TableCell>{tour.serialNumber || '-'}</TableCell>
                        <TableCell>{tour.tourName || '-'}</TableCell>
                        <TableCell>{tour.customerName || '-'}</TableCell>
                        <TableCell>
                          {tour.destinationName || tour.destination || '-'}
                        </TableCell>
                        <TableCell>{formatDate(tour.tourDate)}</TableCell>
                        <TableCell className="text-right">
                          <span dangerouslySetInnerHTML={{ __html: tour.totalPrice ? formatCurrency(tour.totalPrice, tour.currency) : '-' }}></span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedTour(tour)
                                setIsPreviewOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit("tours", tour)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog("tours", tour.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Kayıt bulunamadı.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="financial">
            <div className="rounded-md border">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] font-bold whitespace-nowrap">İşlem No</TableHead>
                    <TableHead className="w-[100px] font-bold">Tarih</TableHead>
                    <TableHead className="w-[120px] font-bold">İşlem Tipi</TableHead>
                    <TableHead className="w-[120px] font-bold">Kategori</TableHead>
                    <TableHead className="pl-4 font-bold">Açıklama</TableHead>
                    <TableHead className="w-[100px] text-right font-bold">Tutar</TableHead>
                    <TableHead className="w-[100px] text-right font-bold">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFinancialData.length > 0 ? (
                    (() => {
                      // Gelir ve giderler için ayrı sayaçlar
                      let incomeCounter = 1;
                      let expenseCounter = 1;
                      
                      return filteredFinancialData.map((financial) => {
                        // Tur ile ilişkili ise ilgili turu bul
                        let tourInfo = null;
                        let displayDate = financial.date;
                        let displayDescription = financial.description || '-';
                        
                        // İşlem numarası hesaplama - F (finansal) için basit sıralı sayı
                        let serialNumber = "";
                        
                        // İşlem tipine göre arka plan rengi belirleme
                        let rowBgColor;
                        
                        if (financial.relatedTourId && financial.category === "Tur Gideri") {
                          // Tur gideri ise ilgili turu bul
                          tourInfo = toursData.find(t => t.id === financial.relatedTourId);
                          
                          if (tourInfo) {
                            // Tur gideri için tur başlangıç tarihini göster
                            displayDate = tourInfo.tourDate;
                            
                            // Tur gideri için önce numara sonra "TF" formatı
                            const numericPart = tourInfo.serialNumber || tourInfo.id?.slice(-4) || "";
                            serialNumber = `${numericPart}TF`;
                            
                            // Açıklama formatını "müşteri adı - gider türü" şeklinde düzenle
                            // Gider türünü description'dan çıkarmak için " - " sonrası kısmı al
                            const expenseType = financial.description?.split(' - ')[1] || "Gider";
                            displayDescription = `${tourInfo.customerName || "Müşteri"} - ${expenseType}`;
                            
                            // Tur giderleri için daha belirgin mavi tonu
                            rowBgColor = "bg-indigo-100";
                          } else {
                            // İlgili tur bulunamadıysa gider sayacıyla numara ata
                            serialNumber = `${expenseCounter++}TF`;
                            // Tur bulunamadığında normal gider rengi
                            rowBgColor = "bg-red-50";
                          }
                        } else {
                          // Normal finans kaydı için gelir veya gidere göre sıralı numara ata
                          if (financial.type === 'income') {
                            serialNumber = `${incomeCounter++}F`;
                            rowBgColor = "bg-green-50"; // Gelir için yeşil arka plan
                          } else {
                            serialNumber = `${expenseCounter++}F`;
                            rowBgColor = "bg-red-50"; // Gider için kırmızı arka plan
                          }
                        }
                        
                        // İşlem numarasının rengini türüne göre değiştir
                        const serialNumberColor = financial.relatedTourId && financial.category === "Tur Gideri"
                          ? "text-indigo-600 font-semibold"  // Tur gideri mavi ve kalın
                          : financial.type === "income"
                            ? "text-green-600"  // Gelir yeşil
                            : "text-red-600";   // Gider kırmızı

                        return (
                          <TableRow key={financial.id} className={`border-b last:border-0 hover:bg-gray-100 transition ${rowBgColor}`}>
                            <TableCell className="py-2 px-3 text-sm whitespace-nowrap font-mono font-bold">
                              <span className={serialNumberColor}>{serialNumber}</span>
                            </TableCell>
                            <TableCell className="py-2 px-3 text-sm whitespace-nowrap">{formatDate(displayDate)}</TableCell>
                            <TableCell className="py-2 px-3 text-sm whitespace-nowrap">
                              {financial.type === "income" ? (
                                <span className="bg-white border border-green-500 text-green-700 px-2 py-1 rounded-full text-xs">Gelir</span>
                              ) : financial.relatedTourId && financial.category === "Tur Gideri" ? (
                                <span className="bg-white border border-red-500 text-red-700 px-2 py-1 rounded-full text-xs">Gider</span>
                              ) : (
                                <span className="bg-white border border-red-500 text-red-700 px-2 py-1 rounded-full text-xs">Gider</span>
                              )}
                            </TableCell>
                            <TableCell className="py-2 px-3 text-sm whitespace-nowrap">
                              {financial.relatedTourId && financial.category === "Tur Gideri" ? (
                                <span className="bg-white border border-indigo-500 text-indigo-700 px-2 py-1 rounded-full text-xs">{financial.category}</span>
                              ) : financial.category ? (
                                <span className={`bg-white border ${financial.type === 'income' ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'} px-2 py-1 rounded-full text-xs`}>
                                  {financial.category}
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="py-2 px-3 text-sm">{displayDescription}</TableCell>
                            <TableCell className="py-2 px-3 text-sm text-right whitespace-nowrap">
                              <span dangerouslySetInnerHTML={{ __html: formatCurrency(financial.amount || 0, financial.currency) }}></span>
                            </TableCell>
                            <TableCell className="py-2 px-1 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setSelectedFinancial(financial)
                                    setIsPreviewOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit("financial", financial)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8"
                                  onClick={() => openDeleteDialog("financial", financial.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Kayıt bulunamadı.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="customers">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>TC/Pasaport No</TableHead>
                    <TableHead>Vatandaşlık / Ülke</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomersData.length > 0 ? (
                    filteredCustomersData.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.name || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>{customer.idNumber || '-'}</TableCell>
                        <TableCell>{customer.citizenship || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setIsPreviewOpen(true)
                              }}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit("customers", customer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog("customers", customer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Kayıt bulunamadı.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "tours" && selectedTour
                ? `Tur Detayları: ${selectedTour.tourName || 'İsimsiz Tur'}`
                : activeTab === "financial" && selectedFinancial
                ? selectedFinancial.relatedTourId && selectedFinancial.category === "Tur Gideri" 
                  ? "Finansal Kayıt Tur Gider Detayları"
                  : selectedFinancial.type === "income"
                    ? "Finansal Kayıt Gelir Detayları" 
                    : "Finansal Kayıt Gider Detayları"
                : activeTab === "customers" && selectedCustomer
                ? `Müşteri Detayları: ${selectedCustomer.name || 'İsimsiz Müşteri'}`
                : "Detaylar"}
            </DialogTitle>
          </DialogHeader>
          {activeTab === "tours" && <TourPreview tour={selectedTour} />}
          {activeTab === "financial" && <FinancialPreview financial={selectedFinancial} />}
          {activeTab === "customers" && <CustomerPreview customer={selectedCustomer} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu kaydı silmek istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu kayıt kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
