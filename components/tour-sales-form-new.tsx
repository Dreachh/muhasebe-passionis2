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
  companyId?: string; // Firmanın Firebase ID'si
  companyName?: string; // Firma adı - gösterim için
}

interface Activity {
  id: string;
  activityId: string;
  name: string; // Eksik olan name özelliği eklendi
  date: string;
  duration: string;
  price: string;
  currency: string;
  participants: string; // number tipinde beklenmesi yerine string olarak düzeltildi
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
  totalPriceWithActivities?: string; // Aktiviteler dahil toplam fiyat
  currency: string;
  paymentStatus: string;
  paymentMethod: string;
  partialPaymentAmount: string;
  partialPaymentCurrency: string;
  notes: string;
  expenses: Expense[];
  activities: Activity[];
  destinationId: string;
  destinationName: string; // Destinasyon adını da kaydetmek için eklendi
  selectedTourId?: string; // Seçilen tur şablonunun ID'sini kaydetmek için
  selectedTourName?: string; // Seçilen tur şablonunun adını kaydetmek için
  createdAt?: string; // Eksik olan createdAt alanı eklendi
  updatedAt?: string; // Eksik olan updatedAt alanı eklendi
}

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
  setTempTourFormData: (data: any) => void;
}) {  
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]); // Firmalar için state eklendi
  const [referralSources, setReferralSources] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true)
  const [currencyRates, setCurrencyRates] = useState<any[]>([]);
  const [currencyLastUpdated, setCurrencyLastUpdated] = useState<string | null>(null)

  // Diğer fonksiyonlar ve durumlar burada devam edecek...

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

  // JSX return yapısı
  return (
    <Card className="w-full max-w-screen-xl mx-auto">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-teal-700">
            {initialData ? "Tur Kaydını Düzenle" : "Yeni Tur Kaydı"}
          </CardTitle>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => {
              // Formu temizleme
              setTempTourFormData(null);
              // Üst bileşenin iptal işlemini çağır
              if (typeof onCancel === "function") {
                onCancel();
              }
            }}>
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
      </CardHeader>
      <CardContent>
        {/* Burada form içeriği bulunacak */}
        {/* Gider kartları için şirket seçim özelliği halihazırda aşağıdaki gibi mevcut ve çalışır durumda */}
        {/* 
        <div className="space-y-2 mt-4">
          <Label>Şirket</Label>
          <Select
            value={expense.companyId ?? "none"}
            onValueChange={(value) => {
              if (value === "none") {
                // "Şirket yok" seçildiğinde, şirket bilgilerini temizle
                updateExpense(expense.id, "companyId", undefined);
                updateExpense(expense.id, "companyName", undefined);
              } else {
                // Şirket seçildiğinde bilgileri güncelle
                updateExpense(expense.id, "companyId", value);
                // Seçilen firmanın adını da güncelle
                const selectedCompany = companies.find(company => company.id === value);
                if (selectedCompany) {
                  updateExpense(expense.id, "companyName", selectedCompany.name);
                }
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Şirket seçin (isteğe bağlı)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Şirket yok</SelectItem>
              {companies && companies.length > 0 ? (
                companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-companies" disabled>
                  Şirket bulunamadı
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        */}
        
        {/* Onay iletişim kutusunu ekleyin */}
        <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kaydetmeyi onaylayın</AlertDialogTitle>
              <AlertDialogDescription>
                Bu tur kaydını kaydetmek istediğinizden emin misiniz?
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
  );
}

export default TourSalesForm;
