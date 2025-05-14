"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Trash2, Save, ArrowRight, ArrowLeft, Check, Printer, Settings, AlertCircle, CircleSlash } from "lucide-react"
import { getExpenseTypes, getProviders, getActivities, getDestinations, getReferralSources, getCompanies } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { generateUUID } from "@/lib/utils";
import { fetchExchangeRates } from "@/lib/currency-service";
import TourSummary from "@/components/tour-summary";

const currencyOptions = [
  { value: "TRY", label: "Türk Lirası (₺)" },
  { value: "USD", label: "Amerikan Doları ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "İngiliz Sterlini (£)" },
  { value: "SAR", label: "Suudi Arabistan Riyali (﷼)" },
];

interface Customer {
  id: string;
  name: string;
  phone: string;
  idNumber: string;
  email?: string;
  address?: string;
}

interface Expense {
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
  companyId?: string;
  companyName?: string;
  category?: string;
  expenseTypeId?: string;
}

interface Activity {
  id: string;
  activityId: string;
  name: string;
  date: string;
  duration: string;
  price: string | number;
  currency: string;
  participants: string | number;
  participantsType: string;
  providerId: string;
  details?: string;
}

interface FormData {
  id: string;
  serialNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerIdNumber: string;
  nationality: string;
  referralSource?: string;
  additionalCustomers?: Customer[];
  tourName: string;
  tourDate: string;
  tourEndDate: string;
  numberOfPeople: number;
  numberOfChildren: number;
  pricePerPerson: string;
  totalPrice: string;
  currency: string;
  paymentStatus: string;
  paymentMethod: string;
  partialPaymentAmount: string;
  partialPaymentCurrency: string;
  notes: string;
  expenses: Expense[];
  activities: Activity[];
  destinationId: string;
  destinationName: string;
  selectedTourId?: string;
  selectedTourName?: string;
  createdAt?: string;
  updatedAt?: string;
}

const getDefaultFormData = (): FormData => ({
  id: generateUUID(),
  serialNumber: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  customerIdNumber: "",
  nationality: "",
  referralSource: "",
  additionalCustomers: [],
  tourName: "",
  tourDate: new Date().toISOString().split("T")[0],
  tourEndDate: "",
  numberOfPeople: 1,
  numberOfChildren: 0,
  pricePerPerson: "",
  totalPrice: "",
  currency: "TRY",
  paymentStatus: "pending",
  paymentMethod: "cash",
  partialPaymentAmount: "",
  partialPaymentCurrency: "TRY",
  notes: "",
  expenses: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  activities: [],
  destinationId: "",
  destinationName: "",
  selectedTourId: "",
  selectedTourName: "",
});

export function TourSalesForm({
  initialData = null,
  onSave,
  onCancel,
  toursData = [],
  onUpdateData,
  onNavigate,
  editingRecord,
  setEditingRecord,
  customersData = [],
  setCustomersData,
  tempTourFormData = null,
  setTempTourFormData
}: {
  initialData?: any | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  toursData: any[];
  onUpdateData: (data: any[]) => void;
  onNavigate?: (view: string) => void;
  editingRecord: any;
  setEditingRecord: (record: any) => void;
  customersData: any[];
  setCustomersData: (data: any[]) => void;
  tempTourFormData: any | null;
  setTempTourFormData: (data: any | null) => void;
}) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [referralSources, setReferralSources] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true)
  const [currencyRates, setCurrencyRates] = useState<any[]>([]);
  const [currencyLastUpdated, setCurrencyLastUpdated] = useState<string | null>(null)

  const [destinationTours, setDestinationTours] = useState<any[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string>("");
  const [isLoadingTours, setIsLoadingTours] = useState<boolean>(false);

  const stepsRef = useRef<HTMLDivElement | null>(null)

  const [formData, setFormData] = useState<FormData>(getDefaultFormData());

  useEffect(() => {
    if (stepsRef.current) {
      stepsRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentStep]);

  useEffect(() => {
    async function loadRates() {
      try {
        const { rates, lastUpdated } = await fetchExchangeRates();
        setCurrencyRates(rates);
        setCurrencyLastUpdated(lastUpdated);
      } catch (error) {
        setCurrencyRates([]);
        setCurrencyLastUpdated(null);
      }
    }
    loadRates();
  }, []);

  useEffect(() => {
    const isReturningFromSettings = tempTourFormData && localStorage.getItem("returnToTourSales") === "true";

    if (initialData) {
      const newFormDataState = {
        ...getDefaultFormData(),
        ...initialData,
        additionalCustomers: initialData.additionalCustomers ? JSON.parse(JSON.stringify(initialData.additionalCustomers)) : [],
        expenses: initialData.expenses ? JSON.parse(JSON.stringify(initialData.expenses)) : [],
        activities: initialData.activities ? JSON.parse(JSON.stringify(initialData.activities)) : [],
        tourDate: initialData.tourDate ? new Date(initialData.tourDate).toISOString().split("T")[0] : getDefaultFormData().tourDate,
        tourEndDate: initialData.tourEndDate ? new Date(initialData.tourEndDate).toISOString().split("T")[0] : getDefaultFormData().tourEndDate,
        createdAt: initialData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (newFormDataState.destinationId && !newFormDataState.destinationName && destinations && destinations.length > 0) {
        const dest = destinations.find((d: any) => d.id === newFormDataState.destinationId);
        if (dest) newFormDataState.destinationName = dest.name;
      }
      
      setFormData(newFormDataState);
      setSelectedTourId(initialData.selectedTourId || "");
      setCurrentStep(0);

      if (setTempTourFormData) {
        setTempTourFormData(null);
      }
      localStorage.removeItem("returnToTourSales");

    } else {
      if (isReturningFromSettings && tempTourFormData) {
        setFormData(tempTourFormData);
        setSelectedTourId(tempTourFormData.selectedTourId || "");
        localStorage.removeItem("returnToTourSales");
        if (setTempTourFormData) {
          setTempTourFormData(null);
        }
      } else {
        setFormData(getDefaultFormData());
        setSelectedTourId("");
        if (setTempTourFormData) {
          setTempTourFormData(null);
        }
        localStorage.removeItem("returnToTourSales");
      }
      setCurrentStep(0);
    }
  }, [initialData, destinations, tempTourFormData, setTempTourFormData]);

  useEffect(() => {
    return () => {
      if (setTempTourFormData) {
        if (localStorage.getItem("returnToTourSales") === "true") {
          setTempTourFormData(formData);
        }
      }
    }
  }, [formData, setTempTourFormData]);

  const steps = [
    { id: "customer", label: "Müşteri Bilgileri" },
    { id: "tour", label: "Tur Detayları" },
    { id: "expenses", label: "Tur Giderleri" },
    { id: "activities", label: "Tur Aktiviteleri" },
    { id: "payment", label: "Ödeme Bilgileri" },
    { id: "summary", label: "Özet" },
  ]

  const calculateTotalExpensesByCurrency = (expenses: Expense[] = []) => {
    const totals: Record<string, number> = {};
    if (Array.isArray(expenses)) {
      expenses.forEach((expense) => {
        const currency = expense.currency || "TRY";
        const amount = Number.parseFloat(expense.amount as string) || 0;
        if (!totals[currency]) totals[currency] = 0;
        totals[currency] += amount;
      });
    }
    return totals;
  };

  // Form verilerini hazırla ve kaydet
  const handleSubmit = () => {
    // Basit doğrulama kontrolleri
    if (!formData.customerName) {
      toast({
        title: "Eksik Bilgi",
        description: "Müşteri adı girilmelidir.",
        variant: "destructive",
      });
      setCurrentStep(0); // Müşteri bilgileri adımına dön
      return;
    }

    if (!formData.tourName) {
      toast({
        title: "Eksik Bilgi",
        description: "Tur adı girilmelidir.",
        variant: "destructive",
      });
      setCurrentStep(1); // Tur detayları adımına dön
      return;
    }

    // Seri numarası formatını düzelt - önce numara, sonra TF
    // Eğer mevcut bir seri numarası yoksa, bugünün tarihini (YYMM) ve 4 haneli bir sayı ile oluştur
    let serialNum = formData.serialNumber;
    if (!serialNum || serialNum.trim() === "") {
      const today = new Date();
      const yearMonthPrefix = `${String(today.getFullYear()).substring(2)}${String(today.getMonth() + 1).padStart(2, '0')}`;
      // Son 4 rakam için rastgele bir sayı oluştur (1000-9999 arası)
      const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
      serialNum = `${yearMonthPrefix}${randomSuffix}TF`; // Örnek: 25051234TF (2025 yılı Mayıs ayı için)
    } else if (serialNum.startsWith("TF")) {
      // Eski format: TF1234 -> Yeni format: 1234TF
      serialNum = `${serialNum.replace("TF", "")}TF`;
    } else if (!serialNum.endsWith("TF")) {
      // Seri numarası TF ile bitmiyorsa ekle
      serialNum = `${serialNum}TF`;
    }

    // Tüm formları güncelleyerek gönder
    const updatedFormData = {
      ...formData,
      serialNumber: serialNum,
      updatedAt: new Date().toISOString(),
    };

    // Konsola verinin son halini yazdır (geliştirme için)
    console.log("Formdan gönderilen son veri:", updatedFormData);

    if (typeof onSave === "function") {
      onSave(updatedFormData);
    }

    // Onay dialogunu kapat
    setIsConfirmDialogOpen(false);
  };

  // Tur veya müşteri bilgileri değiştiğinde güncellenecek fonksiyonlar
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Adımları ilerleten veya geri alan fonksiyon
  const navigateStep = (direction: "next" | "prev") => {
    if (direction === "next" && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (direction === "prev" && currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // componentDidMount benzeri bir etki ile verileri yükle
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Gider türlerini, aktiviteleri ve destinasyonları paralel olarak yükle
        const [expenseTypesData, providersData, activitiesData, destinationsData, referralSourcesData, companiesData] = await Promise.all([
          getExpenseTypes(),
          getProviders(),
          getActivities(),
          getDestinations(),
          getReferralSources(),
          getCompanies()
        ]);

        setExpenseTypes(expenseTypesData);
        setProviders(providersData);
        setActivities(activitiesData);
        setDestinations(destinationsData);
        setReferralSources(referralSourcesData);
        setCompanies(companiesData);
        
        // Gider kategorilerini oluştur
        const categories = expenseTypesData.map((type: any) => ({
          value: type.id,
          label: type.name,
        }));
        setExpenseCategories(categories);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
        setIsLoading(false);
        toast({
          title: "Hata",
          description: "Veriler yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
      }
    }

    // Verileri yükle
    loadData();
  }, [toast]);

  return (
    <Card className="w-full max-w-screen-xl mx-auto">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-teal-700">
            {initialData ? "Tur Kaydını Düzenle" : "Yeni Tur Kaydı"}
          </CardTitle>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => {
              // Formu temizlemeyi onaylama
              if (confirm("Formdaki tüm değişiklikler silinecek. Emin misiniz?")) {
                setFormData(getDefaultFormData());
                setSelectedTourId("");
                setCurrentStep(0);
              }
            }}>
              <CircleSlash className="mr-2 h-4 w-4" />
              Temizle
            </Button>
            
            <Button variant="outline" onClick={onCancel}>
              İptal
            </Button>
            
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => setIsConfirmDialogOpen(true)}
            >
              <Save className="mr-2 h-4 w-4" />
              Kaydet
            </Button>
          </div>
        </div>
        
        {/* Adımlar */}
        <div className="mt-6" ref={stepsRef}>
          <nav className="flex space-x-1 mb-6 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <Button
                key={step.id}
                variant={currentStep === index ? "default" : "outline"}
                className={`flex-shrink-0 ${currentStep === index ? "bg-teal-600 hover:bg-teal-700" : ""}`}
                onClick={() => setCurrentStep(index)}
              >
                {currentStep > index && <Check className="mr-1 h-4 w-4" />}
                {step.label}
              </Button>
            ))}
          </nav>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Aşama içeriği burada gösterilecek */}
        {/* Aşama 1: Müşteri Bilgileri */}
        {currentStep === 0 && (
          <div className="space-y-4">
            {/* Müşteri bilgileri formu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Müşteri Adı</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => updateFormData("customerName", e.target.value)}
                  placeholder="Müşteri adı"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Telefon</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => updateFormData("customerPhone", e.target.value)}
                  placeholder="5XX XXX XX XX"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerEmail">E-posta</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => updateFormData("customerEmail", e.target.value)}
                  placeholder="E-posta adresi"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerIdNumber">TC/Pasaport No</Label>
                <Input
                  id="customerIdNumber"
                  value={formData.customerIdNumber}
                  onChange={(e) => updateFormData("customerIdNumber", e.target.value)}
                  placeholder="Kimlik numarası"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nationality">Uyruk</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => updateFormData("nationality", e.target.value)}
                  placeholder="Uyruk/Vatandaşlık"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="referralSource">Referans Kaynağı</Label>
                <Select
                  value={formData.referralSource}
                  onValueChange={(value) => updateFormData("referralSource", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nereden duydu?" />
                  </SelectTrigger>
                  <SelectContent>
                    {referralSources.map((source: any) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerAddress">Adres</Label>
              <Textarea
                id="customerAddress"
                value={formData.customerAddress}
                onChange={(e) => updateFormData("customerAddress", e.target.value)}
                placeholder="Adres bilgileri"
                rows={3}
              />
            </div>
            
            {/* Adım navigasyon butonları */}
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                type="button"
                variant="default"
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => navigateStep("next")}
              >
                İleri <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Aşama 2: Tur Detayları */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Tur detayları formu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tourName">Tur Adı</Label>
                <Input
                  id="tourName"
                  value={formData.tourName}
                  onChange={(e) => updateFormData("tourName", e.target.value)}
                  placeholder="Tur adı"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="destinationId">Destinasyon</Label>
                <Select
                  value={formData.destinationId}
                  onValueChange={(value) => {
                    // Destinasyon ID'sini güncelle
                    updateFormData("destinationId", value);
                    
                    // Destinasyon adını da güncelle
                    if (value) {
                      const selectedDestination = destinations.find((d: any) => d.id === value);
                      if (selectedDestination) {
                        updateFormData("destinationName", selectedDestination.name);
                      }
                    } else {
                      updateFormData("destinationName", "");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Destinasyon seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((destination: any) => (
                      <SelectItem key={destination.id} value={destination.id}>
                        {destination.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tourDate">Tur Tarihi</Label>
                <Input
                  id="tourDate"
                  type="date"
                  value={formData.tourDate}
                  onChange={(e) => updateFormData("tourDate", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tourEndDate">Bitiş Tarihi (opsiyonel)</Label>
                <Input
                  id="tourEndDate"
                  type="date"
                  value={formData.tourEndDate}
                  onChange={(e) => updateFormData("tourEndDate", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numberOfPeople">Yetişkin Sayısı</Label>
                <Input
                  id="numberOfPeople"
                  type="number"
                  min="1"
                  value={formData.numberOfPeople}
                  onChange={(e) => updateFormData("numberOfPeople", parseInt(e.target.value) || 1)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numberOfChildren">Çocuk Sayısı</Label>
                <Input
                  id="numberOfChildren"
                  type="number"
                  min="0"
                  value={formData.numberOfChildren}
                  onChange={(e) => updateFormData("numberOfChildren", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            {/* Adım navigasyon butonları */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigateStep("prev")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Geri
              </Button>
              
              <Button
                type="button"
                variant="default"
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => navigateStep("next")}
              >
                İleri <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Aşama 3: Fiyat Bilgileri */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <TourSummary 
              formData={formData} 
              calculateTotalExpensesByCurrency={() => calculateTotalExpensesByCurrency(formData.expenses)} 
            />
            
            {/* Adım navigasyon butonları */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigateStep("prev")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Geri
              </Button>
              
              <Button
                type="button"
                variant="default"
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => setIsConfirmDialogOpen(true)}
              >
                <Save className="mr-2 h-4 w-4" /> Kaydet
              </Button>
            </div>
          </div>
        )}
        
        {/* Onay dialogu */}
        <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kaydetmeyi onaylayın</AlertDialogTitle>
              <AlertDialogDescription>
                Bu tur kaydını {initialData ? "güncellemek" : "kaydetmek"} istediğinizden emin misiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit}>Kaydet</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

export default TourSalesForm;
