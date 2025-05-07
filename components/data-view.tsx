"use client"

import { useState } from "react"
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
import { PrintButton } from "@/components/ui/print-button"

// Type definitions
interface TourActivity {
  name: string
  date?: string | Date
  duration?: string
  price: number
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
  id?: string
  type?: string
  name?: string
  provider?: string
  description?: string
  amount?: number
  date?: string | Date
  category?: string
  currency?: string
}

export interface TourData {
  destination?: string // EKLENDİ: Tur destinasyonu

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
  pricePerPerson?: number
  totalPrice?: number
  currency?: string
  paymentStatus?: string
  paymentMethod?: string
  partialPaymentAmount?: number
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
  
  // Function for printing financial records
  const handlePrintFinancial = () => {
    try {
      const companyInfo = JSON.parse(localStorage.getItem('companyInfo') || '{}');
      return (
        <PrintButton
          type="financial"
          data={filteredFinancialData}
          companyInfo={companyInfo}
          dateRange={dateRange}
        />
      );
    } catch (error) {
      console.error('Error during print operation:', error);
      toast({
        title: "Hata",
        description: "Yazdırma işlemi sırasında bir hata oluştu.",
        variant: "destructive",
      });
      return null;
    }
  }
  
  // Add PrintButton component for financial data
  const FinancialPrintButton = () => {
    const companyInfo = JSON.parse(localStorage.getItem('companyInfo') || '{}');
    return (
      <PrintButton
        type="financial"
        data={filteredFinancialData}
        companyInfo={companyInfo}
        dateRange={dateRange}
      />
    );
  }
  
  // Add PrintButton component for customers data
  const CustomersPrintButton = () => {
    const companyInfo = JSON.parse(localStorage.getItem('companyInfo') || '{}');
    return (
      <PrintButton
        type="customers"
        data={filteredCustomersData}
        companyInfo={companyInfo}
        dateRange={dateRange}
      />
    );
  }
  
  // Add PrintButton component for analytics data
  const AnalyticsPrintButton = () => {
    const companyInfo = JSON.parse(localStorage.getItem('companyInfo') || '{}');
    return (
      <PrintButton
        type="analytics"
        data={{
          financialData: filteredFinancialData,
          toursData: filteredToursData,
          customersData: filteredCustomersData
        }}
        companyInfo={companyInfo}
        dateRange={dateRange}
        selectedCurrency={selectedCurrency}
        nationalityData={nationalityData}
        referralSourceData={referralSourceData}
        toursByDestination={toursByDestination}
        toursByMonth={toursByMonth}
        currencySummaries={currencySummaries}
      />
    );
  }
  
  const filteredToursData = toursData.filter(
    (item: TourData) =>
      (item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (item.tourName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  )

  const filteredFinancialData = financialData.filter(
    (item: FinancialData) =>
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (item.category?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (item.type.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredCustomersData = customersData.filter(
    (item: CustomerData) =>
      (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (item.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  )

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
                {tour.paymentStatus === "paid" ? "Ödendi" : 
                 tour.paymentStatus === "partial" ? "Kısmi Ödeme" : 
                 tour.paymentStatus === "pending" ? "Beklemede" : "-"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Ödeme Yöntemi:</span>
              <p>{tour.paymentMethod || '-'}</p>
            </div>
            {tour.paymentStatus === "partial" && (
              <>
                <div>
                  <span className="text-sm text-muted-foreground">Ödenen Miktar:</span>
                  <p>{formatCurrency(tour.partialPaymentAmount || 0, tour.partialPaymentCurrency)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Kalan Miktar:</span>
                  <p>{formatCurrency((tour.totalPrice || 0) - (tour.partialPaymentAmount || 0), tour.currency)}</p>
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
    if (!financial) return null

    // Tur ile ilişkiliyse ilgili turu bul
    let tourInfo = null;
    let customerName = "-";
    let destinationName = "-";
    let displayDate = financial.date;
    let serialNumber = "";
    let expenseType = "";
    
    if (financial.relatedTourId) {
      tourInfo = toursData.find(t => t.id === financial.relatedTourId);
      if (tourInfo) {
        customerName = tourInfo.customerName || "-";
        destinationName = tourInfo.destination || tourInfo.tourName || "-";
        serialNumber = tourInfo.serialNumber || '-';
        
        // Tur gideri ise tur başlangıç tarihini göster
        if (financial.category === "Tur Gideri") {
          displayDate = tourInfo.tourDate;
          
          // Gider açıklamasını ayır
          if (financial.description) {
            const parts = financial.description.split(' - ');
            expenseType = parts.length > 1 ? parts[1] : financial.description;
          }
        }
      }
    }
    
    // Ödeme yöntemini Türkçeye çevir
    const getPaymentMethodTr = (method: string | undefined) => {
      if (!method) return 'Nakit';
      switch (method.toLowerCase()) {
        case 'cash': return 'Nakit';
        case 'credit card': return 'Kredi Kartı';
        case 'bank transfer': return 'Banka Transferi';
        case 'online payment': return 'Online Ödeme';
        case 'check': return 'Çek';
        default: return method;
      }
    };

    const paymentMethod = getPaymentMethodTr(financial.paymentMethod);

    return (
      <div className="p-5 max-h-[70vh] overflow-y-auto">
        <div className="bg-gray-50 rounded-lg p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            <div className="flex items-start">
              <div className="w-1/3 font-semibold text-gray-600">Müşteri:</div>
              <div>{customerName}</div>
            </div>
            <div className="flex items-start">
              <div className="w-1/3 font-semibold text-gray-600">Destinasyon:</div>
              <div>{destinationName}</div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-semibold text-gray-600">İşlem tarihi:</div>
              <div>{formatDate(financial.date)}</div>
            </div>
            <div className="flex items-start">
              <div className="w-1/3 font-semibold text-gray-600">Tur Tarihi:</div>
              <div>{tourInfo ? formatDate(tourInfo.tourDate) : "-"}</div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-semibold text-gray-600">Kategori:</div>
              <div>{financial.category || '-'}</div>
            </div>
            <div className="flex items-start">
              <div className="w-1/3 font-semibold text-gray-600">Açıklama:</div>
              <div>{expenseType || financial.description || '-'}</div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-semibold text-gray-600">{paymentMethod}:</div>
              <div className="font-bold text-blue-700">{formatCurrency(financial.amount || 0, financial.currency)}</div>
            </div>
            
            {serialNumber && (
              <div className="flex items-start">
                <div className="w-1/3 font-semibold text-gray-600">Seri No:</div>
                <div>{serialNumber}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

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
                <span className="text-sm text-muted-foreground">Kimlik No:</span>
                <p>{customer.idNumber || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Veri Görünümü</CardTitle>
        <div className="flex items-center gap-2">
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
          <Button variant="outline" size="sm" onClick={onClose}>
            Kapat
          </Button>
          {activeTab === "financial" && <FinancialPrintButton />}
          {activeTab === "customers" && <CustomersPrintButton />}
          {activeTab === "tours" && <AnalyticsPrintButton />}
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
                    <TableHead>Düzenleyici</TableHead>
                    <TableHead>Müşteri</TableHead>
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
                      <TableCell colSpan={6} className="h-24 text-center">
                        Kayıt bulunamadı.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="financial">
            <div className="flex justify-end mb-2">
              <FinancialPrintButton />
            </div>
            <div className="rounded-md border">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Tarih</TableHead>
                    <TableHead className="w-[80px]">Tür</TableHead>
                    <TableHead className="w-[120px]">Kategori</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="w-[100px] text-right">Tutar</TableHead>
                    <TableHead className="w-[100px] text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFinancialData.length > 0 ? (
                    filteredFinancialData.map((financial) => {
                      // Tur ile ilişkili ise ilgili turu bul
                      let tourInfo = null;
                      let displayDate = financial.date;
                      let displayDescription = financial.description || '-';
                      
                      if (financial.relatedTourId && financial.category === "Tur Gideri") {
                        // Tur gideri ise ilgili turu bul
                        tourInfo = toursData.find(t => t.id === financial.relatedTourId);
                        
                        if (tourInfo) {
                          // Tur gideri için tur başlangıç tarihini göster
                          displayDate = tourInfo.tourDate;
                          
                          // Açıklama formatını "müşteri adı - gider türü" şeklinde düzenle
                          // Gider türünü description'dan çıkarmak için " - " sonrası kısmı al
                          const expenseType = financial.description?.split(' - ')[1] || "Gider";
                          displayDescription = `${tourInfo.customerName || "Müşteri"} - ${expenseType}`;
                        }
                      }
                      
                      // Satır rengi: gelir için yeşil, gider için kırmızı
                      const rowBg = financial.type === "income"
                        ? "bg-green-50"
                        : financial.type === "expense"
                          ? "bg-red-50"
                          : "";

                      return (
                        <TableRow key={financial.id} className={rowBg}>
                          <TableCell className="py-2 px-3 text-sm whitespace-nowrap">{formatDate(displayDate)}</TableCell>
                          <TableCell className="py-2 px-3 text-sm whitespace-nowrap">{financial.type === "income" ? "Gelir" : "Gider"}</TableCell>
                          <TableCell className="py-2 px-3 text-sm whitespace-nowrap">{financial.category || '-'}</TableCell>
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
                    })
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
          
          <TabsContent value="customers">
            <div className="flex justify-end mb-2">
              <CustomersPrintButton />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Kimlik No</TableHead>
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
                      <TableCell colSpan={5} className="h-24 text-center">
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
                ? (() => {
                    // Finansal kaydın tur ile ilişkili olup olmadığını kontrol et
                    if (selectedFinancial.category === "Tur Gideri" && selectedFinancial.relatedTourId) {
                      const tourInfo = toursData.find(t => t.id === selectedFinancial.relatedTourId);
                      if (tourInfo) {
                        // Gider açıklamasını ayıkla
                        const expenseDesc = selectedFinancial.description?.split(' - ')[1] || "Gider";
                        // Seri numarası başlıkta sadece bir kez gösterilecek
                        return `Finansal Kayıt Detayları: ${tourInfo.customerName} - ${expenseDesc}`;
                      }
                    }
                    // Tur ile ilişkili değilse normal açıklamayı göster
                    return `Finansal Kayıt Detayları: ${selectedFinancial.description || 'Açıklama Yok'}`;
                  })()
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
