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
  language?: string; // Dil tercihi eklendi (opsiyonel)
  nationality?: string; // Vatandaşlık eklendi
  referralSource?: string; // Referans kaynağı eklendi
  additionalCustomers: Customer[]; // Ekstra müşteriler eklendi
  tourName: string;
  tourDate: string;
  tourEndDate?: string;
  tourGuide?: string;
  numberOfPeople: string | number;
  numberOfChildren?: string | number;
  pricePerPerson: string | number;
  totalPrice: string | number;
  currency: string;
  details?: string;
  paymentAmount: string | number;
  paymentMethod: string;
  paymentDate: string;
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
  // State tanımlamaları burada olacak
  const [formData, setFormData] = useState<any>({});
  const [currentStep, setCurrentStep] = useState(0);
  const stepsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [referralSources, setReferralSources] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true)
  const [currencyRates, setCurrencyRates] = useState<any[]>([]);
  const [isLoadingTours, setIsLoadingTours] = useState(false);

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

  // Diğer fonksiyonlar...

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

  return (
    <div>
      {/* Form içeriği */}
      <p>Form içeriğinin tamamı burada olacak</p>

      {/* Adım 3: Tur Giderleri (Şirket seçimi için önemli kısım) */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-[#00a1c6]">Tur Giderleri (Muhasebe)</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => onNavigate && onNavigate("settings")}>
              <Settings className="h-3 w-3 mr-1" /> Ayarlar
            </Button>
          </div>

          <div className="border rounded-md p-4 bg-slate-50">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Giderler Hakkında Bilgi:</strong> Bu bölümde tur için yapılacak ödemeleri (gider kalemlerini) ekleyebilirsiniz.
            </p>
          </div>

          <div className="grid gap-6 mt-6">
            {formData.expenses?.map((expense: any) => (
              <Card key={expense.id} className="border border-gray-200">
                <CardHeader className="pb-0">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg font-medium">
                      {expense.name ? expense.name : "Yeni Gider"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500"
                      onClick={() => removeExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Sil</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Gider Türü</Label>
                    <Select
                      value={expense.type || ""}
                      onValueChange={(value) => updateExpense(expense.id, "type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Gider türü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoading ? (
                          <SelectItem value="loading" disabled>
                            Yükleniyor...
                          </SelectItem>
                        ) : expenseTypes && expenseTypes.length > 0 ? (
                          expenseTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-types" disabled>
                            Gider türü bulunamadı
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gider Adı/Açıklaması</Label>
                    <Input
                      value={expense.name || ""}
                      onChange={(e) =>
                        updateExpense(expense.id, "name", e.target.value)
                      }
                      placeholder="Gider adı veya açıklama"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tutar</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={expense.amount || ""}
                        onChange={(e) =>
                          updateExpense(
                            expense.id,
                            "amount",
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Para Birimi</Label>
                      <Select
                        value={expense.currency || "TRY"}
                        onValueChange={(value) =>
                          updateExpense(expense.id, "currency", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Para birimi" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

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

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`included-${expense.id}`}
                        checked={expense.isIncludedInPrice}
                        onCheckedChange={(checked) =>
                          updateExpense(expense.id, "isIncludedInPrice", checked)
                        }
                      />
                      <Label htmlFor={`included-${expense.id}`}>
                        Bu gider tur fiyatına dahil
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              className="flex items-center"
              onClick={addExpense}
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Gider Ekle
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TourSalesForm;
