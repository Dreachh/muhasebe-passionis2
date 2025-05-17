"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { SupplierCard } from "@/components/supplier-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { collection, getDocs, query, orderBy, updateDoc, doc, getDoc, setDoc } from "firebase/firestore"
import { getDb } from "@/lib/firebase-client-module"
import { COLLECTIONS } from "@/lib/db-firebase"
import { useToast } from "@/components/ui/use-toast"

// Borç ve Ödeme için tip tanımları
interface Debt {
  id: string;
  supplierId: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  status: "ACTIVE" | "PAID";
  paidAmount?: number;
}

interface Payment {
  id: string;
  supplierId: string;
  debtId: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
}

interface Supplier {
  id: string;
  name: string;
  type?: string;   // 'supplier' tipini kontrol etmek için eklendi
  debts: Debt[];
  payments: Payment[];
  totalDebt: number;
  totalPaid: number;
}

export function SupplierDebtDashboard() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"name" | "debt">("name");
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<{id: string, name: string}[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  // Firebase'den veri çekme fonksiyonu
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const db = getDb();
      
      // Tedarikçileri çek
      const suppliersQuery = query(
        collection(db, COLLECTIONS.COMPANIES),
        orderBy("name")
      );
      const supplierSnapshot = await getDocs(suppliersQuery);      const suppliersData = supplierSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          name: data.name || "İsimsiz Tedarikçi",
          type: data.type || "",  // Tedarikçi tipini doğru şekilde aldığımızdan emin olalım
        };
      });

      // Borçları çek
      const debtsQuery = query(collection(db, COLLECTIONS.DEBTS));
      const debtsSnapshot = await getDocs(debtsQuery);      const debtsData = debtsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          supplierId: data.companyId, // Ana uygulama-uyum için
          amount: Number(data.amount || 0),
          paidAmount: Number(data.paidAmount || 0), // Ödenmiş tutarı da ekliyoruz
          date: data.dueDate?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          status: (data.status === 'paid' || data.status === 'PAID') ? 'PAID' : 'ACTIVE'
        };
      });

      // Ödemeleri çek
      const paymentsQuery = query(collection(db, COLLECTIONS.PAYMENTS));
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const paymentsData = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        supplierId: doc.data().companyId, // Ana uygulama-uyum için
        debtId: doc.data().debtId || "",
        amount: Number(doc.data().amount || 0),
        date: doc.data().paymentDate?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      }));

      // Supplier nesnelerini oluştur
      const enrichedSuppliers = suppliersData.map(supplier => {
        const supplierDebts = debtsData.filter(debt => debt.supplierId === supplier.id);
        const supplierPayments = paymentsData.filter(payment => payment.supplierId === supplier.id);
        
        const totalDebt = supplierDebts.reduce((sum, debt) => sum + (debt.amount), 0);
        const totalPaid = supplierPayments.reduce((sum, payment) => sum + (payment.amount), 0);
        
        return {
          ...supplier,
          debts: supplierDebts,
          payments: supplierPayments,
          totalDebt,
          totalPaid
        };
      });      // Yalnızca "supplier" tipinde olanları filtrele 
      const suppliersFiltered = enrichedSuppliers.filter(supplier => supplier.type === "supplier");
      
      console.log("Tüm tedarikçiler:", enrichedSuppliers);
      console.log("Filtrelenmiş tedarikçiler:", suppliersFiltered);
      setSuppliers(suppliersFiltered);
    } catch (error) {
      console.error("Tedarikçi verileri alınırken hata:", error);
      // Hata durumunda örnek veri göster
      setSuppliers(mockSuppliers);
    } finally {
      setLoading(false);
    }
  };  // Ayarlarda kayıtlı olan şirketleri çekme fonksiyonu
  const fetchAvailableCompanies = async () => {
    try {
      const db = getDb();
      const companiesRef = collection(db, COLLECTIONS.COMPANIES);
      const querySnapshot = await getDocs(companiesRef);
      
      const companiesList: {id: string, name: string}[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        companiesList.push({
          id: doc.id,
          name: data.name || "İsimsiz Şirket",
        });
      });
      
      // Firma adına göre sırala
      companiesList.sort((a, b) => a.name.localeCompare(b.name));
      setAvailableCompanies(companiesList);
    } catch (error) {
      console.error("Şirketler çekilirken hata:", error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchAvailableCompanies();
  }, []);  // Yeni tedarikçi ekleme
  const handleAddSupplier = async () => {
    if (!selectedCompanyId) {
      toast({
        title: "Hata",
        description: "Lütfen bir firma seçin",
        variant: "destructive",
      });
      return;
    }

    try {
      // Seçilen firmanın bilgilerini bul
      const selectedCompany = availableCompanies.find(company => company.id === selectedCompanyId);
      
      if (!selectedCompany) {
        console.error("Seçilen firma bulunamadı");
        return;
      }
      
      // İlk olarak belgenin varlığını kontrol et
      const db = getDb();
      const docRef = doc(db, COLLECTIONS.COMPANIES, selectedCompanyId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.error("Firma veritabanında bulunamadı", selectedCompanyId);
        // Belge bulunamadıysa, yeni bir belge oluştur
        await setDoc(docRef, {
          name: selectedCompany.name,
          type: "supplier",
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log("Yeni firma belgesi oluşturuldu");
      } else {
        // Belge varsa güncelle
        await updateDoc(docRef, {
          type: "supplier",
          updatedAt: new Date(),
        });
        console.log("Mevcut firma belgesi güncellendi");
      }      // İşlem sonrası
      setSelectedCompanyId("");
      setIsAddSupplierDialogOpen(false);
      
      console.log("Tedarikçi başarıyla kaydedildi:", selectedCompanyId);
      
      // Listeyi yenile - önce mevcut şirketleri çekelim, sonra tedarikçileri
      await fetchAvailableCompanies();
      await fetchSuppliers();
        toast({
        title: "Başarılı",
        description: `${selectedCompany.name} tedarikçi olarak eklendi. Tedarikçi kartları sayfayı yeniledikten sonra görünecektir.`,
        duration: 5000, // 5 saniye göster
      });
    } catch (error) {
      console.error("Tedarikçi eklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Tedarikçi eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Filtreleme ve sıralama
  const filteredAndSortedSuppliers = [...suppliers]
    .filter(supplier => 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "name") {
        return a.name.localeCompare(b.name);
      } else { // debt
        const aBalance = a.totalDebt - a.totalPaid;
        const bBalance = b.totalDebt - b.totalPaid;
        return bBalance - aBalance; // en yüksek borç üstte
      }
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Tedarikçi ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "name" | "debt")}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sıralama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">İsme Göre</SelectItem>
              <SelectItem value="debt">Borç Miktarına Göre</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isAddSupplierDialogOpen} onOpenChange={setIsAddSupplierDialogOpen}>
            <DialogTrigger asChild>
              <Button className="whitespace-nowrap">Tedarikçi Ekle</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Tedarikçi Ekle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="supplierSelect" className="text-sm font-medium leading-none">
                    Tedarikçi Firması
                  </label>
                  <Select 
                    value={selectedCompanyId} 
                    onValueChange={(value) => setSelectedCompanyId(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Firma seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCompanies.length > 0 ? (
                        availableCompanies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-companies" disabled>
                          Kayıtlı firma bulunamadı
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {availableCompanies.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Önce Ayarlar &gt; Şirket Yönetimi menüsünden firma eklemelisiniz.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddSupplier}>Ekle</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Yükleniyor...</div>
      ) : filteredAndSortedSuppliers.length > 0 ? (
        <div className="grid gap-6">
          {filteredAndSortedSuppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} onUpdate={fetchSuppliers} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          {searchTerm ? "Arama kriterine uygun tedarikçi bulunamadı." : "Henüz tedarikçi eklenmemiş."}
        </div>
      )}
    </div>
  )
}

// Örnek veri - API entegrasyonu olmadığında kullanılacak
const mockSuppliers = [  {
    id: "sup_1",
    name: "Çilem Turizm",
    type: "supplier",
    debts: [
      {
        id: "debt_1",
        supplierId: "sup_1",        amount: 1000,
        currency: "USD",
        description: "Rehber Ücreti",
        date: "2024-05-10",
        status: "ACTIVE" as "ACTIVE",
      },
      {
        id: "debt_2",
        supplierId: "sup_1",        amount: 2500,
        currency: "TRY",
        description: "Otel Rezervasyonu",
        date: "2024-05-12",
        status: "ACTIVE" as "ACTIVE",
      },
    ],
    payments: [
      {
        id: "pay_1",
        supplierId: "sup_1",
        debtId: "debt_1",
        amount: 500,
        currency: "USD",
        description: "Kısmi Ödeme",
        date: "2024-05-15",
      },
    ],
    totalDebt: 3500,
    totalPaid: 500,
  },  {
    id: "sup_2",
    name: "Antalya Tur",
    type: "supplier",
    debts: [
      {
        id: "debt_3",
        supplierId: "sup_2",        amount: 750,
        currency: "EUR",
        description: "Transfer Ücreti",
        date: "2024-05-08",
        status: "ACTIVE" as "ACTIVE",
      },
    ],
    payments: [],
    totalDebt: 750,
    totalPaid: 0,
  },  {
    id: "sup_3",
    name: "İstanbul Rehberlik",
    type: "supplier",
    debts: [
      {
        id: "debt_4",
        supplierId: "sup_3",        amount: 5000,
        currency: "TRY",
        description: "Rehberlik Hizmeti",
        date: "2024-05-01",
        status: "ACTIVE" as "ACTIVE",
      },
      {
        id: "debt_5",
        supplierId: "sup_3",        amount: 3000,
        currency: "TRY",
        description: "Müze Giriş Ücretleri",
        date: "2024-05-03",
        status: "PAID" as "PAID",
      },
    ],
    payments: [
      {
        id: "pay_2",
        supplierId: "sup_3",
        debtId: "debt_5",
        amount: 3000,
        currency: "TRY",
        description: "Tam Ödeme",
        date: "2024-05-05",
      },
    ],
    totalDebt: 8000,
    totalPaid: 3000,
  },
];
