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
import { getExpenseTypes, getProviders, getActivities, getDestinations, getReferralSources } from "@/lib/db"
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

// Tür tanımlamaları ekleniyor
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
  amount: string | number; // Hem string hem de number kabul edilebilir
  currency: string;
  details?: string;
  isIncludedInPrice: boolean;
  rehberInfo?: string; // Opsiyonel alanlar eklendi
  transferType?: string;
  transferPerson?: string;
  acentaName?: string;
}

interface Activity {
  id: string;
  activityId: string;
  name: string; // Eksik olan name özelliği eklendi
  date: string;
  duration: string;
  price: string;
  currency: string;
  participants: string;
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
  referralSource?: string; // İsteğe bağlı olarak güncellendi
  additionalCustomers?: Customer[]; // İsteğe bağlı olarak güncellendi
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
}

export function TourSalesForm({
  initialData = null,
  tempData = null,
  onSave,
  onCancel,
  onStoreFormData,
  onNavigateToSettings,
  customersData = [],
}: {
  initialData?: Partial<FormData> | null;
  tempData?: Partial<FormData> | null;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  onStoreFormData: (data: FormData) => void;
  onNavigateToSettings: () => void;
  customersData: Customer[];
}) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [referralSources, setReferralSources] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true)
  const [currencyRates, setCurrencyRates] = useState<any[]>([]);
  const [currencyLastUpdated, setCurrencyLastUpdated] = useState<string | null>(null)

  // Adım göstergesi için referans
  const stepsRef = useRef<HTMLDivElement | null>(null)

  // Initialize form data from initialData, tempData, or default values
  const [formData, setFormData] = useState<FormData>(() => {
    if (tempData) return tempData as FormData
    if (initialData) return initialData as FormData

    return {
      id: generateUUID(),
      serialNumber: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      customerAddress: "",
      customerIdNumber: "",
      nationality: "", // Müşterinin vatandaşlık/ülke bilgisi
      referralSource: "", // Müşterinin nereden geldiği/bulduğu bilgisi
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
    }
  })

  // Aktivitelerin toplam fiyatını hesapla (sadece ana para birimi ile)
  const calculateTotalActivitiesPrice = () => {
    if (!formData.activities || formData.activities.length === 0) return 0;
    // Sadece turun ana para birimindeki aktiviteleri topluyoruz
    return formData.activities.reduce((sum, activity) => {
      if (activity.currency === formData.currency) {
        const price = Number(activity.price) || 0;
        const participants = Number(activity.participants) || 0;
        return sum + price * (participants > 0 ? participants : 1);
      }
      return sum;
    }, 0);
  };

  // Toplam fiyatı otomatik güncelle (kişi başı fiyat * kişi sayısı + aktiviteler)
  useEffect(() => {
    const base = Number(formData.pricePerPerson) * Number(formData.numberOfPeople || 1);
    const activitiesTotal = calculateTotalActivitiesPrice();
    const total = base + activitiesTotal;
    setFormData((prev) => ({ ...prev, totalPrice: total ? total.toString() : "" }));
    // eslint-disable-next-line
  }, [formData.pricePerPerson, formData.numberOfPeople, formData.activities, formData.currency]);

  // Adım geçiş fonksiyonları
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  // Kayıt işlemi fonksiyonu
  function handleSubmit() {
    if (typeof onSave === "function") {
      onSave(formData);
      setIsConfirmDialogOpen(false);
      // Formu sıfırla ve adım 1'e dön
      setFormData({
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
      });
      setCurrentStep(0);
    } else {
      toast({ title: "Hata", description: "Kayıt fonksiyonu tanımlı değil!", variant: "destructive" });
    }
  }

  // Adım değiştiğinde sayfayı yukarı kaydır
  useEffect(() => {
    if (stepsRef.current) {
      stepsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep]);

  // Döviz kurlarını yükle
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

  // initialData değişikliklerini izle
  useEffect(() => {
    if (initialData) {
      console.log("Tour edit data received:", initialData);
      // Düzenlenecek tur verilerini forma yükle
      const formData = {
        ...initialData,
        id: initialData.id || generateUUID(),
        tourDate: initialData.tourDate || new Date().toISOString().split("T")[0],
        tourEndDate: initialData.tourEndDate || "",
        serialNumber: initialData.serialNumber || "",
        tourName: initialData.tourName || "",
        customerName: initialData.customerName || "",
        customerPhone: initialData.customerPhone || "",
        customerEmail: initialData.customerEmail || "",
        customerIdNumber: initialData.customerIdNumber || "",
        customerAddress: initialData.customerAddress || "",
        nationality: initialData.nationality || "", // Vatandaşlık/ülke bilgisi
        numberOfPeople: initialData.numberOfPeople || 1,
        numberOfChildren: initialData.numberOfChildren || 0,
        pricePerPerson: initialData.pricePerPerson || "",
        totalPrice: initialData.totalPrice || "",
        currency: initialData.currency || "TRY",
        paymentStatus: initialData.paymentStatus || "pending",
        paymentMethod: initialData.paymentMethod || "cash",
        partialPaymentAmount: initialData.partialPaymentAmount || "",
        partialPaymentCurrency: initialData.partialPaymentCurrency || "TRY",
        notes: initialData.notes || "",
        expenses: initialData.expenses || [],
        activities: initialData.activities || [],
        destinationId: initialData.destinationId || "",
      };

      // Form verilerini güncelle
      setFormData(formData);
    }
  }, [initialData]);

  // Gider türlerini, sağlayıcıları, aktiviteleri ve destinasyonları yükle
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true); // Yükleme başladığında yükleme durumunu güncelle

      try {
        console.log('Veri yükleme başlıyor...');

        // Tüm verileri paralel olarak yükle ve her bir isteğe timeout ekle
        const fetchWithTimeout = async (
          fetchPromise: Promise<any>, // API çağrısı için Promise türü
          name: string, // Veri adı
          fallbackStorageKey: string // LocalStorage anahtarı
        ): Promise<any[]> => {
          // Önce localStorage'dan yüklemeyi dene
          try {
            const cachedData = localStorage.getItem(fallbackStorageKey);
            if (cachedData) {
              const parsedData = JSON.parse(cachedData);
              if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
                console.log(`${name} önbellekten yüklendi:`, parsedData.length, 'adet veri');
                return parsedData;
              }
            }
          } catch (cacheError) {
            console.warn(`${name} önbellekten yüklenemedi:`, cacheError);
          }

          // Önbellekte yoksa API'den yüklemeyi dene
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`${name} yüklenirken zaman aşımına uğradı`)), 10000);
          });

          try {
            const result = await Promise.race([fetchPromise, timeoutPromise]);
            if (result && Array.isArray(result) && result.length > 0) {
              console.log(`${name} API'den başarıyla yüklendi:`, result.length, 'adet veri');

              // Başarılı sonuçları önbelleğe kaydet
              try {
                localStorage.setItem(fallbackStorageKey, JSON.stringify(result));
              } catch (storageError) {
                console.warn(`${name} önbelleğe kaydedilemedi:`, storageError);
              }

              return result;
            } else {
              console.warn(`${name} API'den yüklendi fakat veri yok veya boş dizi döndü`);
              throw new Error(`${name} için veri bulunamadı`);
            }
          } catch (error) {
            console.error(`${name} yüklenirken hata:`, error);

            // Hata durumunda varsayılan veriler
            if (name === 'Destinasyonlar') {
              const defaultData = [
                { id: "default-dest-1", name: "Antalya", country: "Türkiye", description: "Güzel sahiller" },
                { id: "default-dest-2", name: "İstanbul", country: "Türkiye", description: "Tarihi yarımada" },
                { id: "default-dest-3", name: "Kapadokya", country: "Türkiye", description: "Peri bacaları" }
              ];
              try {
                localStorage.setItem(fallbackStorageKey, JSON.stringify(defaultData));
              } catch (storageError) { }
              return defaultData;
            } else if (name === 'Aktiviteler') {
              const defaultData = [
                { id: "default-act-1", name: "Tekne Turu", destinationId: "default-dest-1", price: "300", currency: "TRY", description: "Güzel bir tekne turu" },
                { id: "default-act-2", name: "Müze Gezisi", destinationId: "default-dest-2", price: "150", currency: "TRY", description: "Tarihi müze gezisi" },
                { id: "default-act-3", name: "Balon Turu", destinationId: "default-dest-3", price: "2000", currency: "TRY", description: "Kapadokya'da balon turu" }
              ];
              try {
                localStorage.setItem(fallbackStorageKey, JSON.stringify(defaultData));
              } catch (storageError) { }
              return defaultData;
            }

            return [];
          }
        };

        // Verileri paralel olarak getir
        try {
          console.log('Referans kaynakları ve diğer veriler yükleniyor...');

          const [types, providersData, activitiesData, destinationsData, referralSourcesData] = await Promise.all([
            fetchWithTimeout(getExpenseTypes(), 'Gider türleri', 'expenseTypes'),
            fetchWithTimeout(getProviders(), 'Sağlayıcılar', 'providers'),
            fetchWithTimeout(getActivities(), 'Aktiviteler', 'activities'),
            fetchWithTimeout(getDestinations(), 'Destinasyonlar', 'destinations'),
            fetchWithTimeout(getReferralSources(), 'Referans Kaynakları', 'referralSources')
          ]);

          // Verileri yerel değişkenlere kaydet ve null kontrolü yap
          const typesResult = Array.isArray(types) ? types : [];
          const providersResult = Array.isArray(providersData) ? providersData : [];
          const activitiesResult = Array.isArray(activitiesData) ? activitiesData : [];
          const destinationsResult = Array.isArray(destinationsData) ? destinationsData : [];
          const referralSourcesResult = Array.isArray(referralSourcesData) ? referralSourcesData : [];

          // Verileri localStorage'a da kaydet (adımlar arası geçişte kaybolmaması için)
          try {
            localStorage.setItem('expenseTypes', JSON.stringify(typesResult));
            localStorage.setItem('providers', JSON.stringify(providersResult));
            localStorage.setItem('activities', JSON.stringify(activitiesResult));
            localStorage.setItem('destinations', JSON.stringify(destinationsResult));
            localStorage.setItem('referralSources', JSON.stringify(referralSourcesResult));
            console.log('Tüm veriler localStorage\'a başarıyla kaydedildi');
          } catch (storageError) {
            console.warn('Veriler önbelleğe kaydedilemedi:', storageError);
          }

          // Verileri state'e kaydet
          setExpenseTypes(typesResult);
          setProviders(providersResult);
          setActivities(activitiesResult);
          setDestinations(destinationsResult);
          setReferralSources(referralSourcesResult);

          console.log('Yüklenen destinasyonlar:', destinationsResult.length, 'adet');
          console.log('Yüklenen aktiviteler:', activitiesResult.length, 'adet');
          console.log('Yüklenen referans kaynakları:', referralSourcesResult.length, 'adet');
        } catch (parallelLoadError) {
          console.error('Paralel veri yükleme sırasında hata:', parallelLoadError);

          // Hata durumunda localStorage'dan yüklemeyi dene
          try {
            const cachedReferralSources = localStorage.getItem('referralSources');
            if (cachedReferralSources) {
              const parsedReferralSources = JSON.parse(cachedReferralSources);
              if (Array.isArray(parsedReferralSources) && parsedReferralSources.length > 0) {
                console.log('Referans kaynakları önbellekten yüklendi:', parsedReferralSources.length, 'adet');
                setReferralSources(parsedReferralSources);
              }
            }
          } catch (cacheError) {
            console.warn('Referans kaynakları önbellekten yüklenemedi:', cacheError);
          }
        }

        // Gider kategorilerini oluştur
        const categories = [
          { value: "accommodation", label: "Konaklama" },
          { value: "transportation", label: "Ulaşım" },
          { value: "transfer", label: "Transfer" },
          { value: "guide", label: "Rehberlik" },
          { value: "agency", label: "Acente" },
          { value: "porter", label: "Hanutçu" },
          { value: "food", label: "Yemek" },
          { value: "activity", label: "Aktivite" },
          { value: "general", label: "Genel" },
          { value: "other", label: "Diğer" },
        ];
        setExpenseCategories(categories);

        // Veri yükleme tamamlandı
        setIsLoading(false);
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);

        // Hata durumunda localStorage'dan veri yüklemeyi dene
        try {
          const cachedTypes = localStorage.getItem('expenseTypes');
          const cachedProviders = localStorage.getItem('providers');
          const cachedActivities = localStorage.getItem('activities');
          const cachedDestinations = localStorage.getItem('destinations');
          const cachedReferralSources = localStorage.getItem('referralSources');

          if (cachedTypes) setExpenseTypes(JSON.parse(cachedTypes));
          if (cachedProviders) setProviders(JSON.parse(cachedProviders));
          if (cachedActivities) setActivities(JSON.parse(cachedActivities));
          if (cachedDestinations) {
            const parsedDestinations = JSON.parse(cachedDestinations);
            setDestinations(parsedDestinations);
            console.log('Önbellek destinasyonlar yüklendi:', parsedDestinations.length, 'adet');
          }
          if (cachedReferralSources) {
            const parsedReferralSources = JSON.parse(cachedReferralSources);
            setReferralSources(parsedReferralSources);
            console.log('Önbellek referans kaynakları yüklendi:', parsedReferralSources.length, 'adet');
          }

          toast({
            title: "Uyarı",
            description: "Veriler önbellekten yüklendi. Güncel olmayabilir.",
            variant: "default",
          });
        } catch (cacheError) {
          console.error("Önbellekten veri yükleme hatası:", cacheError);
          toast({
            title: "Hata",
            description: "Veriler yüklenemedi. Lütfen sayfayı yenileyin.",
            variant: "destructive",
          });
        }

        setIsLoading(false); // Hata durumunda da yükleme durumunu güncelle
      }
    };

    loadData();
  }, [toast])

  // Store form data when component unmounts or when navigating away
  useEffect(() => {
    return () => {
      if (onStoreFormData && localStorage.getItem("returnToTourSales") === "true") {
        onStoreFormData(formData)
      }
    }
  }, [formData, onStoreFormData])

  const steps = [
    { id: "customer", label: "Müşteri Bilgileri" },
    { id: "tour", label: "Tur Detayları" },
    { id: "expenses", label: "Tur Giderleri" },
    { id: "activities", label: "Tur Aktiviteleri" },
    { id: "payment", label: "Ödeme Bilgileri" },
    { id: "summary", label: "Özet" },
  ]

  // handleChange fonksiyonu düzeltildi
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      let updated = { ...prev, [name]: value };
      if (name === "pricePerPerson") {
        const totalPrice = Number.parseFloat(value) * Number.parseInt(prev.numberOfPeople?.toString() || "1");
        updated.totalPrice = totalPrice.toString();
      }
      if (name === "numberOfPeople" && prev.pricePerPerson) {
        const totalPrice = Number.parseFloat(prev.pricePerPerson?.toString() || "0") * Number.parseInt(value);
        updated.totalPrice = totalPrice.toString();
      }
      return updated;
    });
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Ek müşteri ekleme
  const addAdditionalCustomer = () => {
    const newCustomer = {
      id: generateUUID(),
      name: "",
      phone: "",
      idNumber: "",
      email: "", // Yeni eklenen alan
      address: "", // Yeni eklenen alan
      destinationName: formData.destinationId ? destinations.find((d: any) => d.id === formData.destinationId)?.name : "",
    }

    setFormData((prev: any) => ({
      ...prev,
      additionalCustomers: [...(prev.additionalCustomers || []), newCustomer],
    }))
  }

  // Ek müşteri silme
  const removeAdditionalCustomer = (id: string) => {
    setFormData((prev: any) => ({
      ...prev,
      additionalCustomers: (prev.additionalCustomers || []).filter((customer: any) => customer.id !== id),
    }))
  }

  // Ek müşteri güncelleme
  const updateAdditionalCustomer = (id: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      additionalCustomers: (prev.additionalCustomers || []).map((customer: any) => {
        if (customer.id === id) {
          const updatedCustomer = { ...customer, [field]: value };
          if (field === 'destinationId') {
            const destination = destinations.find((d: any) => d.id === value);
            updatedCustomer.destinationName = destination ? destination.name : '';
          }
          return updatedCustomer;
        }
        return customer;
      }),
    }));
  }

  const handleNavigateToSettings = () => {
    if (typeof onNavigateToSettings === "function") {
      onNavigateToSettings();
    }
  };

  // Gider ekleme fonksiyonu
  const addExpense = () => {
    const newExpense = {
      id: generateUUID(),
      type: "",
      name: "",
      amount: "",
      currency: "TRY",
      details: "",
      isIncludedInPrice: false,
    };
    setFormData((prev: any) => ({
      ...prev,
      expenses: [...(prev.expenses || []), newExpense],
    }));
  };

  // Gider silme fonksiyonu
  const removeExpense = (id: string) => {
    setFormData((prev: any) => ({
      ...prev,
      expenses: (prev.expenses || []).filter((expense: any) => expense.id !== id),
    }));
  };

  // Gider güncelleme fonksiyonu
  const updateExpense = (id: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      expenses: (prev.expenses || []).map((expense: any) =>
        expense.id === id ? { ...expense, [field]: value } : expense
      ),
    }));
  };

  // Aktivite ekleme fonksiyonu
  const addTourActivity = () => {
    const newActivity = {
      id: generateUUID(),
      activityId: "",
      name: "", // Eksik olan name özelliği eklendi
      date: "",
      duration: "",
      price: "",
      currency: "TRY",
      participants: "",
      participantsType: "all",
      providerId: "",
      details: "",
    };
    setFormData((prev: any) => ({
      ...prev,
      activities: [...(prev.activities || []), newActivity],
    }));
  };

  // Aktivite silme fonksiyonu
  const removeTourActivity = (id: string) => {
    setFormData((prev: any) => ({
      ...prev,
      activities: (prev.activities || []).filter((activity: any) => activity.id !== id),
    }));
  };

  // Aktivite güncelleme fonksiyonu
  const updateTourActivity = (id: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      activities: (prev.activities || []).map((activity: any) => {
        if (activity.id === id) {
          // Eğer activityId değişiyorsa, ilgili aktivitenin adını da güncelle
          if (field === "activityId") {
            const selected = activities.find((a: any) => a.id === value);
            return {
              ...activity,
              activityId: value,
              name: selected ? selected.name : "",
            };
          }
          return { ...activity, [field]: value };
        }
        return activity;
      }),
    }));
  };

  // Tüm giderleri para birimine göre toplayan fonksiyon
  const calculateTotalExpensesByCurrency = () => {
    const totals: Record<string, number> = {};
    if (formData.expenses && Array.isArray(formData.expenses)) {
      (formData.expenses as any[]).forEach((expense) => {
        const currency = expense.currency || "TRY";
        const amount = Number.parseFloat(expense.amount) || 0;
        if (!totals[currency]) totals[currency] = 0;
        totals[currency] += amount;
      });
    }
    return totals;
  };

  return (
    <Card className="w-full max-w-screen-xl mx-auto">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-teal-700">
            {initialData ? "Tur Kaydını Düzenle" : "Yeni Tur Kaydı"}
          </CardTitle>

          <div className="flex space-x-2">
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

        <div ref={stepsRef} className="mt-6 relative">
          <nav aria-label="Progress" className="mb-8">
            <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
              {steps.map((step, index) => (
                <li key={step.id} className="md:flex-1">
                  <div
                    className={`group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0 ${currentStep === index
                      ? "border-teal-600 md:border-teal-600"
                      : currentStep > index
                        ? "border-teal-300 md:border-teal-300"
                        : "border-gray-200 md:border-gray-200"
                      }`}
                  >
                    <span
                      className={`text-sm font-medium ${currentStep === index
                        ? "text-teal-600"
                        : currentStep > index
                          ? "text-teal-500"
                          : "text-gray-500"
                        }`}
                    >
                      Adım {index + 1}
                    </span>
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={(e) => e.preventDefault()}>
          {/* Adım 1: Müşteri Bilgileri */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Müşteri Adı Soyadı</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={formData.customerName ?? ""}
                  onChange={handleChange}
                  placeholder="Müşteri adını girin"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Telefon</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone ?? ""}
                    onChange={handleChange}
                    placeholder="Telefon numarası"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">E-posta</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={formData.customerEmail ?? ""}
                    onChange={handleChange}
                    placeholder="E-posta adresi"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerAddress">Adres</Label>
                <Textarea
                  id="customerAddress"
                  name="customerAddress"
                  value={formData.customerAddress ?? ""}
                  onChange={handleChange}
                  placeholder="Adres bilgisi"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerIdNumber">T.C. Kimlik / Pasaport No</Label>
                <Input
                  id="customerIdNumber"
                  name="customerIdNumber"
                  value={formData.customerIdNumber ?? ""}
                  onChange={handleChange}
                  placeholder="Kimlik numarası"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Vatandaşlık / Ülke</Label>
                  <Select
                    value={formData.nationality ?? ""}
                    onValueChange={(value) => handleSelectChange("nationality", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ülke seçin" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {/* Ülke listesini countries.ts dosyasından al */}
                      {(() => {
                        try {
                          // Dinamik olarak ülke listesini import et
                          const countriesList: { code: string; name: string }[] = require("@/lib/countries").countries;
                          return countriesList.map((country: { code: string; name: string }, index: number) => (
                            <SelectItem key={country.code + '-' + index} value={country.name}>{country.name}</SelectItem>
                          ));
                        } catch (error) {
                          console.error("Ülke listesi yüklenemedi:", error);
                          // Hata durumunda en yaygın ülkeleri göster
                          return [
                            <SelectItem key="TR" value="Türkiye">Türkiye</SelectItem>,
                            <SelectItem key="DE" value="Almanya">Almanya</SelectItem>,
                            <SelectItem key="GB" value="Birleşik Krallık">İngiltere</SelectItem>,
                            <SelectItem key="US" value="Amerika Birleşik Devletleri">Amerika</SelectItem>,
                            <SelectItem key="RU" value="Rusya">Rusya</SelectItem>,
                            <SelectItem key="FR" value="Fransa">Fransa</SelectItem>,
                            <SelectItem key="NL" value="Hollanda">Hollanda</SelectItem>,
                            <SelectItem key="UA" value="Ukrayna">Ukrayna</SelectItem>,
                            <SelectItem key="IT" value="İtalya">İtalya</SelectItem>,
                            <SelectItem key="other" value="Diğer">Diğer</SelectItem>
                          ];
                        }
                      })()}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referralSource">Müşteriyi Nereden Bulduk?</Label>
                  <Select
                    value={formData.referralSource}
                    onValueChange={(value) => handleSelectChange("referralSource", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Referans kaynağı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {referralSources && referralSources.length > 0 ? (
                        referralSources.map((source: any) => (
                          <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="website">İnternet Sitemiz</SelectItem>
                          <SelectItem value="hotel">Otel Yönlendirmesi</SelectItem>
                          <SelectItem value="local_guide">Hanutçu / Yerel Rehber</SelectItem>
                          <SelectItem value="walk_in">Kapı Önü Müşterisi</SelectItem>
                          <SelectItem value="repeat">Tekrar Gelen Müşteri</SelectItem>
                          <SelectItem value="recommendation">Tavsiye</SelectItem>
                          <SelectItem value="social_media">Sosyal Medya</SelectItem>
                          <SelectItem value="other">Diğer</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ek Katılımcılar */}
              <div className="space-y-2 mt-6">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Ek Katılımcılar</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAdditionalCustomer}>
                    <Plus className="h-4 w-4 mr-2" />
                    Katılımcı Ekle
                  </Button>
                </div>

                {formData.additionalCustomers?.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground border rounded-md">
                    Henüz ek katılımcı eklenmemiş
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.additionalCustomers?.map((customer, index) => (
                      <Card key={customer.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">Katılımcı {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAdditionalCustomer(customer.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Ad Soyad</Label>
                            <Input
                              value={customer.name}
                              onChange={(e) => updateAdditionalCustomer(customer.id, "name", e.target.value)}
                              placeholder="Ad soyad"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Telefon</Label>
                            <Input
                              value={customer.phone}
                              onChange={(e) => updateAdditionalCustomer(customer.id, "phone", e.target.value)}
                              placeholder="Telefon numarası"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>T.C. Kimlik / Pasaport No</Label>
                            <Input
                              value={customer.idNumber}
                              onChange={(e) => updateAdditionalCustomer(customer.id, "idNumber", e.target.value)}
                              placeholder="Kimlik numarası"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>E-posta</Label>
                            <Input
                              value={customer.email}
                              onChange={(e) => updateAdditionalCustomer(customer.id, "email", e.target.value)}
                              placeholder="E-posta adresi"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Adres</Label>
                            <Textarea
                              value={customer.address}
                              onChange={(e) => updateAdditionalCustomer(customer.id, "address", e.target.value)}
                              placeholder="Adres bilgisi"
                              rows={2}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Adım 2: Tur Detayları */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Seri Numarası</Label>
                  <Input
                    id="serialNumber"
                    name="serialNumber"
                    value={formData.serialNumber ?? ""}
                    onChange={handleChange}
                    placeholder="Tur seri numarası"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tourName">Tur Kaydını Oluşturan Kişi</Label>
                  <Input
                    id="tourName"
                    name="tourName"
                    value={formData.tourName ?? ""}
                    onChange={handleChange}
                    placeholder="Kaydı oluşturan kişinin adını girin"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationId">Destinasyon</Label>
                {isLoading ? (
                  <div className="flex items-center space-x-2 p-2 border rounded-md bg-slate-50">
                    <div className="animate-spin h-4 w-4 border-2 border-teal-500 rounded-full border-t-transparent"></div>
                    <span className="text-sm text-muted-foreground">Destinasyonlar yükleniyor...</span>
                  </div>
                ) : (
                  <Select
                    value={formData.destinationId ?? ""}
                    onValueChange={(value) => handleSelectChange("destinationId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Destinasyon seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.length > 0 ? (
                        destinations.map((destination) => (
                          <SelectItem key={destination.id} value={destination.id}>
                            {destination.name} ({destination.country})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-destinations">
                          Destinasyon bulunamadı. Lütfen ayarlardan ekleyin.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tourDate">Başlangıç Tarihi</Label>
                  <Input
                    id="tourDate"
                    name="tourDate"
                    type="date"
                    value={formData.tourDate ?? new Date().toISOString().split("T")[0]}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tourEndDate">Bitiş Tarihi</Label>
                  <Input
                    id="tourEndDate"
                    name="tourEndDate"
                    type="date"
                    value={formData.tourEndDate ?? ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfPeople">Yetişkin Sayısı</Label>
                  <Input
                    id="numberOfPeople"
                    name="numberOfPeople"
                    type="number"
                    min="1"
                    value={formData.numberOfPeople ?? 1}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfChildren">Çocuk Sayısı</Label>
                  <Input
                    id="numberOfChildren"
                    name="numberOfChildren"
                    type="number"
                    min="0"
                    value={formData.numberOfChildren ?? 0}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerPerson">Kişi Başı Fiyat</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pricePerPerson"
                      name="pricePerPerson"
                      type="number"
                      step="0.01"
                      value={formData.pricePerPerson ?? ""}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />
                    <Select value={formData.currency ?? "TRY"} onValueChange={(value) => handleSelectChange("currency", value)}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Para birimi" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPrice">Toplam Fiyat</Label>
                  <Input
                    id="totalPrice"
                    name="totalPrice"
                    type="number"
                    step="0.01"
                    value={formData.totalPrice ?? ""}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes ?? ""}
                  onChange={handleChange}
                  placeholder="Ek notlar"
                  rows={3}
                />
              </div>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>

                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Adım 3: Tur Giderleri */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-[#00a1c6]">Tur Giderleri (Muhasebe)</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleNavigateToSettings}>
                  Ayarlara Git
                </Button>
              </div>

              <div className="border rounded-md p-4 bg-slate-50">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Giderler Hakkında Bilgi:</strong> Bu bölümde tur için yapılacak ödemeleri (giderleri) kaydedebilirsiniz.
                  Her bir gider için önce kategori seçin (konaklama, ulaşım vb.), sonra o kategoriye ait gider türlerinden birini seçin.
                </p>
                <p className="text-sm text-muted-foreground">
                  Gider türleri ve sağlayıcılar ayarlar sayfasından eklenebilir. Eğer istediğiniz gider türü listede yoksa,
                  "Ayarlara Git" düğmesini kullanarak yeni gider türleri ekleyebilirsiniz.
                </p>
              </div>

              {/* Gider Listesi */}
              <div className="space-y-4">
                {formData.expenses.length === 0 && (
                  <div className="border border-dashed rounded-md p-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <CircleSlash className="h-12 w-12 text-muted-foreground opacity-40" />
                      <div className="text-muted-foreground">Henüz gider eklenmemiş</div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {formData.expenses.map((expense, index) => (
                    <Card key={expense.id} className="p-4 border-l-4 border-l-[#00a1c6]">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-[#00a1c6]">Gider {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeExpense(expense.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Gider Türü</Label>
                          <Select
                            value={expense.type}
                            onValueChange={(value) => updateExpense(expense.id, "type", value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Gider türü seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="konaklama">Konaklama</SelectItem>
                              <SelectItem value="ulasim">Ulaşım</SelectItem>
                              <SelectItem value="rehber">Rehber</SelectItem>
                              <SelectItem value="acenta">Acenta / Hanutçu</SelectItem>
                              <SelectItem value="aktivite">Aktivite</SelectItem>
                              <SelectItem value="yemek">Yemek</SelectItem>
                              <SelectItem value="genel">Genel</SelectItem>
                              <SelectItem value="diger">Diğer</SelectItem>
                            </SelectContent>
                          </Select>
                          {(!expense.type || expense.type === "") && (
                            <div className="text-red-500 text-xs mt-1">Gider türü seçilmelidir.</div>
                          )}
                        </div>

                        {/* Gider Türüne Göre Dinamik Alanlar */}
                        {expense.type === "rehber" && (
                          <div className="space-y-2">
                            <Label>Rehber Bilgisi</Label>
                            <Input
                              value={expense.rehberInfo ?? ""}
                              onChange={(e) => updateExpense(expense.id, "rehberInfo", e.target.value)}
                              placeholder="Rehber adı ve iletişim bilgileri"
                            />
                          </div>
                        )}

                        {expense.type === "ulasim" && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Ulaşım Tipi</Label>
                              <Select
                                value={expense.transferType ?? ""}
                                onValueChange={(value) => updateExpense(expense.id, "transferType", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Ulaşım tipi seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ucak">Uçak</SelectItem>
                                  <SelectItem value="otobus">Otobüs</SelectItem>
                                  <SelectItem value="arac">Özel Araç</SelectItem>
                                  <SelectItem value="transfer">Transfer</SelectItem>
                                  <SelectItem value="diger">Diğer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {(expense.transferType === "arac" || expense.transferType === "transfer") && (
                              <div className="space-y-2">
                                <Label>Transfer Yapacak Kişi</Label>
                                <Input
                                  value={expense.transferPerson ?? ""}
                                  onChange={(e) => updateExpense(expense.id, "transferPerson", e.target.value)}
                                  placeholder="Sürücü veya transfer sorumlusu"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {expense.type === "acenta" && (
                          <div className="space-y-2">
                            <Label>Acenta İsmi</Label>
                            <Input
                              value={expense.acentaName ?? ""}
                              onChange={(e) => updateExpense(expense.id, "acentaName", e.target.value)}
                              placeholder="Acenta veya hanutçu adı"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Açıklama</Label>
                          <Input
                            value={expense.name ?? ""}
                            onChange={(e) => updateExpense(expense.id, "name", e.target.value)}
                            placeholder="Gider açıklaması"
                            required
                          />
                          {(!expense.name || expense.name === "") && (
                            <div className="text-red-500 text-xs mt-1">Açıklama girilmelidir.</div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Tutar</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={expense.amount ?? ""}
                                onChange={(e) => updateExpense(expense.id, "amount", e.target.value)}
                                placeholder="0.00"
                              />
                              <Select
                                value={expense.currency}
                                onValueChange={(value) => updateExpense(expense.id, "currency", value)}
                              >
                                <SelectTrigger className="w-[100px]">
                                  <SelectValue placeholder="Para birimi" />
                                </SelectTrigger>
                                <SelectContent>
                                  {currencyOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Detaylar</Label>
                            <Input
                              value={expense.details ?? ""}
                              onChange={(e) => updateExpense(expense.id, "details", e.target.value)}
                              placeholder="Ek bilgiler"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 mt-4">
                          <Checkbox
                            id={`included-${expense.id}`}
                            checked={expense.isIncludedInPrice}
                            onCheckedChange={(checked) =>
                              updateExpense(expense.id, "isIncludedInPrice", checked === true)
                            }
                          />
                          <label
                            htmlFor={`included-${expense.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Tur fiyatına dahil
                          </label>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Gider Ekle ve İleri/Geri Butonları */}
              <div className="flex flex-col md:flex-row justify-end items-center gap-2 mt-6">
                <div className="flex-1 w-full md:w-auto flex justify-start md:justify-end mb-2 md:mb-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-dashed border-[#00a1c6] text-[#00a1c6]"
                    onClick={addExpense}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Gider Ekle
                  </Button>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Geri
                  </Button>
                  <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                    İleri
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Adım 4: Tur Aktiviteleri */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-[#00a1c6]">Tur Aktiviteleri</h3>
              </div>

              <div className="text-sm text-muted-foreground mb-2">
                Aktiviteler ekstra ücretli hizmetlerdir ve tur fiyatına eklenir.
              </div>

              {formData.activities.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border rounded-md">
                  Henüz aktivite eklenmemiş
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.activities.map((activity, index) => (
                    <Card key={activity.id} className="p-4 border-l-4 border-l-[#00a1c6]">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-[#00a1c6]">Aktivite {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTourActivity(activity.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Aktivite</Label>
                          {isLoading ? (
                            <div className="flex items-center space-x-2 p-2 border rounded-md bg-slate-50">
                              <div className="animate-spin h-4 w-4 border-2 border-teal-500 rounded-full border-t-transparent"></div>
                              <span className="text-sm text-muted-foreground">Aktiviteler yükleniyor...</span>
                            </div>
                          ) : (
                            <Select
                              value={activity.activityId || ""}
                              onValueChange={(value) => updateTourActivity(activity.id, "activityId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Aktivite seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {activities && activities.length > 0 ? (
                                  activities.map((act) => (
                                    <SelectItem key={act.id} value={act.id}>
                                      {act.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-activities">
                                    Aktivite bulunamadı. Lütfen ayarlardan ekleyin.
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Tarih</Label>
                          <Input
                            type="date"
                            value={activity.date ?? ""}
                            onChange={(e) => updateTourActivity(activity.id, "date", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Süre</Label>
                          <Input
                            value={activity.duration ?? ""}
                            onChange={(e) => updateTourActivity(activity.id, "duration", e.target.value)}
                            placeholder="2 saat, Tam gün vb."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Fiyat</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={activity.price ?? ""}
                              onChange={(e) => updateTourActivity(activity.id, "price", e.target.value)}
                              placeholder="0.00"
                            />
                            <Select
                              value={activity.currency ?? "TRY"}
                              onValueChange={(value) => updateTourActivity(activity.id, "currency", value)}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Para birimi" />
                              </SelectTrigger>
                              <SelectContent>
                                {currencyOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Katılımcı Sayısı</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`all-participants-${activity.id}`}
                                checked={activity.participantsType === "all"}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    updateTourActivity(activity.id, "participantsType", "all");
                                    updateTourActivity(activity.id, "participants", Number(formData.numberOfPeople) || 0);
                                  } else {
                                    updateTourActivity(activity.id, "participantsType", "custom");
                                  }
                                }}
                              />
                              <label
                                htmlFor={`all-participants-${activity.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Tüm tur katılımcıları ({formData.numberOfPeople} kişi)
                              </label>
                            </div>

                            {activity.participantsType === "custom" && (
                              <div className="flex items-center space-x-2 mt-2">
                                <Input
                                  type="number"
                                  min="1"
                                  max={formData.numberOfPeople}
                                  value={activity.participants ?? ""}
                                  onChange={(e) => updateTourActivity(activity.id, "participants", Number(e.target.value))}
                                  placeholder="Katılımcı sayısı"
                                />
                                <span className="text-sm text-muted-foreground">
                                  / {formData.numberOfPeople} kişi
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Sağlayıcı</Label>
                          <Select
                            value={activity.providerId ?? ""}
                            onValueChange={(value) => updateTourActivity(activity.id, "providerId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sağlayıcı seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {providers && providers.length > 0 ? (
                                providers.map((provider) => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    {provider.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-providers">
                                  Sağlayıcı bulunamadı. Lütfen ayarlardan ekleyin.
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Detaylar</Label>
                          <Input
                            value={activity.details ?? ""}
                            onChange={(e) => updateTourActivity(activity.id, "details", e.target.value)}
                            placeholder="Ek bilgiler"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Aktivite Ekle ve İleri/Geri Butonları */}
              <div className="flex flex-col md:flex-row justify-end items-center gap-2 mt-6">
                <div className="flex-1 w-full md:w-auto flex justify-start md:justify-end mb-2 md:mb-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-dashed border-[#00a1c6] text-[#00a1c6]"
                    onClick={addTourActivity}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Aktivite Ekle
                  </Button>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Geri
                  </Button>
                  <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                    İleri
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Adım 5: Ödeme Bilgileri */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Ödeme Durumu</Label>
                <Select
                  value={formData.paymentStatus ?? "pending"}
                  onValueChange={(value) => handleSelectChange("paymentStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ödeme durumu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="partial">Kısmi Ödeme</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="refunded">İade Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.paymentStatus === "partial" && (
                <div className="space-y-2">
                  <Label htmlFor="partialPaymentAmount">Yapılan Ödeme Tutarı</Label>
                  <div className="flex gap-2">
                    <Input
                      id="partialPaymentAmount"
                      name="partialPaymentAmount"
                      type="number"
                      step="0.01"
                      value={formData.partialPaymentAmount ?? ""}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />
                    <Select
                      value={formData.partialPaymentCurrency ?? "TRY"}
                      onValueChange={(value) => handleSelectChange("partialPaymentCurrency", value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Para birimi" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Ödeme Yöntemi</Label>
                <Select
                  value={formData.paymentMethod ?? "cash"}
                  onValueChange={(value) => handleSelectChange("paymentMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ödeme yöntemi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Nakit</SelectItem>
                    <SelectItem value="creditCard">Kredi Kartı</SelectItem>
                    <SelectItem value="bankTransfer">Banka Transferi</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>

                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Adım 6: Özet */}
          {currentStep === 5 && (
            <div>
              <TourSummary formData={{
                ...formData,
                expenses: formData.expenses.map((expense) => ({
                  ...expense,
                  amount: typeof expense.amount === "string" ? parseFloat(expense.amount) : expense.amount,
                })),
                activities: formData.activities.map((activity) => ({
                  ...activity,
                  price: typeof activity.price === "string" ? parseFloat(activity.price) : activity.price,
                  participants: activity.participantsType === "all"
                    ? formData.numberOfPeople
                    : activity.participants,
                })),
              }} calculateTotalExpensesByCurrency={calculateTotalExpensesByCurrency} />
              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>
                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={() => setIsConfirmDialogOpen(true)}>
                  <Save className="mr-2 h-4 w-4" />
                  Kaydet
                </Button>
              </div>
            </div>
          )}

        </form>
      </CardContent>

      {/* Onay Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kaydı Onayla</AlertDialogTitle>
            <AlertDialogDescription>
              Tur kaydını kaydetmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction className="bg-teal-600 hover:bg-teal-700" onClick={handleSubmit}>
              Kaydet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Tur Özeti Bileşeni - Örnek Kullanım */}

    </Card>
  )
}

export default TourSalesForm;
