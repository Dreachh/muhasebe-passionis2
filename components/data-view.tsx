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
import { formatCurrency, formatDate } from "@/lib/data-utils"
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
      
      if (item.relatedTourId && item.category === "Tur Gideri") {
        const tourInfo = toursData.find(t => t.id === item.relatedTourId);
        if (tourInfo) {
          serialNumber = `F${tourInfo.serialNumber || tourInfo.id?.slice(-4) || ""}`;
          tourCustomerName = tourInfo.customerName || "";
          
          const expenseType = item.description?.split(' - ')[1] || "Gider";
          displayDescription = `${tourInfo.customerName || "Müşteri"} - ${expenseType}`;
        } else {
          serialNumber = `F${expenseCounter++}`;
        }
      } else {
        // Normal finans kaydı için gelir veya gidere göre sıralı numara ata
        if (item.type === 'income') {
          serialNumber = `F${incomeCounter++}`;
        } else {
          serialNumber = `F${expenseCounter++}`;
        }
      }
      
      return {
        ...item,
        _serialNumber: serialNumber,  // Önceden hesaplanmış işlem numarası
        _displayDate: displayDate,
        _displayDescription: displayDescription,
        _tourCustomerName: tourCustomerName
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
    
    return dateFiltered.filter(item => {
      // Sabit numarayı kullan
      const serialNumber = item._serialNumber;
      
      // Farklı formatlarda aranabilen işlem numarası kontrolü
      // F3 veya 3 gibi aramalarda hem tam metin hem de sayı olarak kontrolü yap
      const searchWithoutF = searchLower.startsWith("f") ? searchLower.substring(1) : searchLower;
      const serialWithoutF = serialNumber.toLowerCase().substring(1);
      
      // F olmadan doğrudan sayı karşılaştırması
      const searchNumberOnly = searchLower.replace(/\D/g, ''); // Sadece sayılar
      const serialNumberOnly = serialNumber.replace(/\D/g, ''); // Sadece sayılar
      
      const isSerialMatch = 
        serialNumber.toLowerCase() === searchLower || // Tam eşleşme (F1)
        serialWithoutF === searchWithoutF || // F hariç eşleşme (1)
        serialNumber.toLowerCase().includes(searchLower) || // İşlem no içinde arama
        serialWithoutF === searchNumberOnly || // Sayı olarak eşleşme
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
    if (!tour) return null

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Tur Bilgileri</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Seri No:</span>
                <p>{tour.serialNumber || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Tur Adı:</span>
                <p>{tour.tourName || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Tur Tarihi:</span>
                <p>{formatDate(tour.tourDate)}</p>
              </div>
              {tour.tourEndDate && (
                <div>
                  <span className="text-sm text-muted-foreground">Bitiş Tarihi:</span>
                  <p>{formatDate(tour.tourEndDate)}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">Kişi Sayısı:</span>
                <p>{tour.numberOfPeople || 0}</p>
              </div>
              {tour.numberOfChildren && tour.numberOfChildren > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Çocuk Sayısı:</span>
                  <p>{tour.numberOfChildren}</p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Müşteri Bilgileri</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Ad Soyad:</span>
                <p>{tour.customerName || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Telefon:</span>
                <p>{tour.customerPhone || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">E-posta:</span>
                <p>{tour.customerEmail || '-'}</p>
              </div>
              {tour.customerIdNumber && (
                <div>
                  <span className="text-sm text-muted-foreground">Kimlik No:</span>
                  <p>{tour.customerIdNumber}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Ödeme Bilgileri</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Kişi Başı Ücret:</span>
              <p>{tour.pricePerPerson ? formatCurrency(tour.pricePerPerson, tour.currency) : '-'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Toplam Ücret:</span>
              <p>{tour.totalPrice ? formatCurrency(tour.totalPrice, tour.currency) : '-'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Ödeme Durumu:</span>
              <p>
                {tour.paymentStatus === "completed" ? "Tamamlandı" : 
                 tour.paymentStatus === "partial" ? "Kısmi Ödeme" : 
                 tour.paymentStatus === "pending" ? "Beklemede" :
                 tour.paymentStatus === "refunded" ? "İade" :
                 tour.paymentStatus || "-"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Ödeme Yöntemi:</span>
              <p>
                {tour.paymentMethod === "cash" ? "Nakit" : 
                 tour.paymentMethod === "credit_card" ? "Kredi Kartı" : 
                 tour.paymentMethod === "bank_transfer" ? "Banka Havalesi" : 
                 tour.paymentMethod === "online_payment" ? "Online Ödeme" : 
                 tour.paymentMethod || "-"}
              </p>
            </div>
            {tour.paymentStatus === "partial" && (
              <>
                <div>
                  <span className="text-sm text-muted-foreground">Ödenen Miktar:</span>
                  <p>{formatCurrency(tour.partialPaymentAmount || 0, tour.partialPaymentCurrency)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Kalan Miktar:</span>
                  <p>{formatCurrency(Number(tour.totalPrice || 0) - Number(tour.partialPaymentAmount || 0), tour.currency)}</p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {tour.activities && tour.activities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Aktiviteler</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">
                      <div>Aktivite</div>
                      <div className="text-xs text-gray-500">(Activity)</div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div>Tarih</div>
                      <div className="text-xs text-gray-500">(Date)</div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div>Süre</div>
                      <div className="text-xs text-gray-500">(Duration)</div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div>Katılımcı Sayısı</div>
                      <div className="text-xs text-gray-500">(Participants)</div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div>Kişi Başı Ücret</div>
                      <div className="text-xs text-gray-500">(Price per Person)</div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div>Toplam Ücret</div>
                      <div className="text-xs text-gray-500">(Total Price)</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tour.activities.map((activity, index) => {
                    const participants = Number(activity.participants) || 0;
                    const price = Number(activity.price) || 0;
                    const totalPrice = participants > 0 ? price * participants : price;
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>{activity.name}</TableCell>
                        <TableCell>{activity.date ? formatDate(activity.date) : '-'}</TableCell>
                        <TableCell>{activity.duration || '-'}</TableCell>
                        <TableCell className="text-center">{participants > 0 ? participants : '-'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(price, activity.currency || tour.currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalPrice, activity.currency || tour.currency)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        
        {tour.additionalCustomers && tour.additionalCustomers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Ek Müşteriler</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Kimlik No</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tour.additionalCustomers.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell>{customer.name || '-'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>{customer.idNumber || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        
        {tour.expenses && tour.expenses.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Harcamalar</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Harcama</TableHead>
                    <TableHead>Sağlayıcı</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tour.expenses.map((expense, index) => (
                    <TableRow key={index}>
                      <TableCell>{expense.name || '-'}</TableCell>
                      <TableCell>{expense.provider || '-'}</TableCell>
                      <TableCell>{expense.date ? formatDate(expense.date) : '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.amount || 0, expense.currency || tour.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        
        {tour.notes && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Notlar</h3>
            <p className="whitespace-pre-wrap">{tour.notes}</p>
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => handlePrint(tour)} className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" />
            Yazdır
          </Button>
        </DialogFooter>
      </div>
    )
  }

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
                    <TableHead>Düzenlenen Tur</TableHead>
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
                          {tour.totalPrice ? formatCurrency(tour.totalPrice, tour.currency) : '-'}
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
                    <TableHead className="w-[100px] font-bold">İşlem Tipi</TableHead>
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
                            
                            // Tur gideri için "F" + turun seri numarası
                            serialNumber = `F${tourInfo.serialNumber || tourInfo.id?.slice(-4) || ""}`;
                            
                            // Açıklama formatını "müşteri adı - gider türü" şeklinde düzenle
                            // Gider türünü description'dan çıkarmak için " - " sonrası kısmı al
                            const expenseType = financial.description?.split(' - ')[1] || "Gider";
                            displayDescription = `${tourInfo.customerName || "Müşteri"} - ${expenseType}`;
                            
                            // Tur giderleri için mavi tonu (tur ile uyumlu)
                            rowBgColor = "bg-indigo-50";
                          } else {
                            // İlgili tur bulunamadıysa gider sayacıyla numara ata
                            serialNumber = `F${expenseCounter++}`;
                            // Tur bulunamadığında normal gider rengi
                            rowBgColor = "bg-red-50";
                          }
                        } else {
                          // Normal finans kaydı için gelir veya gidere göre sıralı numara ata
                          if (financial.type === 'income') {
                            serialNumber = `F${incomeCounter++}`;
                            rowBgColor = "bg-green-50"; // Gelir için yeşil arka plan
                          } else {
                            serialNumber = `F${expenseCounter++}`;
                            rowBgColor = "bg-red-50"; // Gider için kırmızı arka plan
                          }
                        }
                        
                        // İşlem numarasının rengini türüne göre değiştir
                        const serialNumberColor = financial.relatedTourId && financial.category === "Tur Gideri"
                          ? "text-indigo-600"  // Tur gideri mavi
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
                              {formatCurrency(financial.amount || 0, financial.currency)}
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
