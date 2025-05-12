"use client"

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Calendar, Globe, FileText, BarChart2, Settings, Save } from "lucide-react"
import { formatCurrency, formatCurrencyGroups } from "@/lib/data-utils"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

import type { FinancialData, CustomerData, TourData } from "../app/page"; // Doğru tip importu

interface MainDashboardProps {
  onNavigate: (view: string) => void;
  financialData?: FinancialData[];
  toursData?: TourData[];
  customersData?: CustomerData[];
}

export function MainDashboard({ onNavigate, financialData = [], toursData = [], customersData = [] }: MainDashboardProps) {
  // Tüm tur satışlarını dahil et (tarih filtresi yok)

  // Finansal Gelir (sadece finansal kayıtlar)
  const incomeByCurrency = financialData
    .filter((item) => item.type === "income")
    .reduce<Record<string, number>>((acc, item) => {
      const currency = item.currency || "TRY";
      const amount = Number.parseFloat(item.amount?.toString() || "0") || 0;
      acc[currency] = (acc[currency] || 0) + amount;
      return acc;
    }, {});

  // Finansal Gider (sadece finansal kayıtlar, Tur Gideri hariç)
  const expenseByCurrency = financialData
    .filter((item) => item.type === "expense" && item.category !== "Tur Gideri")
    .reduce<Record<string, number>>((acc, item) => {
      const currency = item.currency || "TRY";
      const amount = Number.parseFloat(item.amount?.toString() || "0") || 0;
      acc[currency] = (acc[currency] || 0) + amount;
      return acc;
    }, {});

  // Tur Geliri: Sadece totalPrice veya ödenen kısım, completed ise aktiviteler ayrıca eklenmez!
  const tourIncomeByCurrency = toursData.reduce((acc, tour) => {
    if (tour.paymentStatus === 'partial') {
      const paidCur = tour.partialPaymentCurrency || tour.currency || 'TRY';
      const paidAmount = Number(tour.partialPaymentAmount) || 0;
      acc[paidCur] = (acc[paidCur] || 0) + paidAmount;
      // Sadece kısmi ödenen aktiviteler eklenir
      if (Array.isArray(tour.activities)) {
        tour.activities.forEach(act => {
          if (act.partialPaymentAmount) {
            const cur = act.partialPaymentCurrency || act.currency || tour.currency || 'TRY';
            acc[cur] = (acc[cur] || 0) + Number(act.partialPaymentAmount);
          }
        });
      }
    } else if (tour.paymentStatus === 'completed') {
      const cur = tour.currency || 'TRY';
      acc[cur] = (acc[cur] || 0) + (Number(tour.totalPrice) || 0);
      // completed durumunda aktiviteler ayrıca eklenmez!
    }
    // Diğer durumlarda gelir eklenmez
    return acc;
  }, {} as Record<string, number>);

  // Tur Gideri: Her döviz için ayrı ayrı topla - tamamen yeniden yazıldı
  const tourExpenseByCurrency = toursData.reduce((acc, tour) => {
    // Her turun giderleri üzerinde döngü kur
    if (Array.isArray(tour.expenses)) {
      tour.expenses.forEach((expense) => {
        if (!expense) return; // Geçersiz giderler için atla
        
        // Giderin para birimini belirle
        const currency = expense.currency || tour.currency || "TRY";
        
        // Gider tutarını doğru şekilde ayrıştır
        let amount = 0;
        if (typeof expense.amount === "number") {
          amount = expense.amount;
        } else if (typeof expense.amount === "string") {
          // String temizleme işlemi
          const cleanedAmount = expense.amount.replace(/[^\d.,]/g, '').replace(',', '.');
          amount = parseFloat(cleanedAmount);
        }
        
        // Geçerli bir rakam ise ekle
        if (!isNaN(amount) && amount > 0) {
          acc[currency] = (acc[currency] || 0) + amount;
        }
      });
    }
    return acc;
  }, {} as Record<string, number>);

  // Toplam müşteri sayısı
  const totalCustomers = customersData.length

  // Yaklaşan turlar (bugünden sonraki turlar, eksik veri varsa fallback)
  const today = new Date();
  const upcomingTours = toursData.filter((item) => {
    if (!item || !item.tourDate) return false;
    const tourDate = new Date(item.tourDate);
    return tourDate > today;
  });

  // Sayfalama için tek bir state
  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFinancialPage, setCurrentFinancialPage] = useState(1);
  
  // Tur satışları için tarih filtresi
  const [tourDateRange, setTourDateRange] = useState<DateRange | undefined>();
  const [isTourDateFilterActive, setIsTourDateFilterActive] = useState(false);

  // Finansal kayıtlar için tarih filtresi
  const [financialDateRange, setFinancialDateRange] = useState<DateRange | undefined>();
  const [isFinancialDateFilterActive, setIsFinancialDateFilterActive] = useState(false);

  // Tur ve finans verilerini birleştir ve tarihe göre sırala
  const combinedTransactions = (() => {
    // Tur satışları
    const tourTransactions = toursData.map(tour => ({
      id: tour.id,
      type: 'tour',
      date: tour.tourDate,
      serialNumber: tour.serialNumber || tour.id?.slice(-4) || "INV",
      name: tour.tourName,
      customerName: tour.customerName,
      selectedTourName: tour.selectedTourName || "", // Seçilen tur şablonu adını doğrudan ekleyelim
      destination: tour.destinationName || "", // Destinasyon adını da ekleyelim
      amount: tour.totalPrice,
      currency: tour.currency,
      status: tour.paymentStatus,
      originalData: tour
    }));
    
    // Tur giderlerini tur bazında grupla
    const tourExpenseGroups = {};
    const regularFinancialTransactions = [];
    
    // Gelir ve giderler için ayrı sayaçlar oluştur ve 1'den başlat
    let incomeCounter = 1;
    let expenseCounter = 1;
    
    // Tüm tur satışları için boş gruplar oluştur (hiç gideri olmayanları bile göstermek için)
    toursData.forEach(tour => {
      const tourId = tour.id;
      const tourSerialNumber = tour.serialNumber || "";
      
      // Eğer tur için henüz bir gider grubu yoksa oluştur
      if (!tourExpenseGroups[tourId]) {
        tourExpenseGroups[tourId] = {
          id: `tourexp-${tourId}`,
          type: 'finance',
          date: tour.tourDate, // Tur başlangıç tarihini kullan
          serialNumber: `F${tourSerialNumber}`, // F1501 gibi bir format
          name: 'Tur Gider Toplamı',
          customerName: `${tour.customerName || "Müşteri"} - Tur Satışı Toplam Gideri`,
          amount: 0,
          currency: tour.currency || 'TRY',
          status: 'expense', // Gider olarak işaretle
          category: 'Tur Gideri',
          tourId: tourId,
          originalData: {
            id: `tourexp-${tourId}`,
            type: 'expense',
            category: 'Tur Gideri',
            relatedTourId: tourId,
            expenses: [] // İlgili giderleri burada toplayacağız
          }
        };
      }
    });
    
    // Önce tur içindeki giderleri ekleyelim (tour.expenses)
    toursData.forEach(tour => {
      if (tour && tour.expenses && Array.isArray(tour.expenses) && tour.expenses.length > 0) {
        const tourId = tour.id;
        
        // Eğer bu tur için bir gider grubu varsa
        if (tourExpenseGroups[tourId]) {
          // Giderleri para birimlerine göre topla
          const expensesByCurrency = {};
          
          // Tüm giderleri topla
          tour.expenses.forEach(expense => {
            if (expense) {
              // Para birimi belirleme
              const currency = expense.currency || tour.currency || "TRY";
              
              // Tutarı doğru şekilde ayrıştır
              let amount = 0;
              if (typeof expense.amount === "number") {
                amount = expense.amount;
              } else if (typeof expense.amount === "string") {
                // String temizleme işlemi
                const cleanedAmount = expense.amount.replace(/[^\d.,]/g, '').replace(',', '.');
                amount = parseFloat(cleanedAmount);
              }
              
              // Geçerli bir rakam ise ekle
              if (!isNaN(amount) && amount > 0) {
                expensesByCurrency[currency] = (expensesByCurrency[currency] || 0) + amount;
                
                // Gider detayını da ekle
                tourExpenseGroups[tourId].originalData.expenses.push({
                  ...expense,
                  relatedTourId: tourId,
                  type: 'expense',
                  category: expense.type || 'Tur Gideri',
                  // Temizlenmiş tutarı ekle
                  cleanedAmount: amount
                });
              }
            }
          });
          
          // Toplam gider tutarını güncelle
          tourExpenseGroups[tourId].amount = Object.values(expensesByCurrency).reduce((sum: number, val: number) => sum + val, 0);
          tourExpenseGroups[tourId].expensesByCurrency = expensesByCurrency;
        }
      }
    });
    
    // Finansal işlemleri grupla
    financialData.forEach((finance) => {
      // Tur giderleri için ilgili turun seri numarasını kullan
      let serialNumber;
      let displayDate = finance.date; // Varsayılan olarak işlem tarihi
      
      // Eğer tur ile ilişkili bir gider ise grupla
      if (finance.relatedTourId && finance.type === "expense") {
        const relatedTour = toursData.find(t => t.id === finance.relatedTourId);
        
        if (relatedTour) {
          const tourId = relatedTour.id;
          
          // İlgili tura ait gider grubunu güncelle
          if (tourExpenseGroups[tourId]) {
            // Tutarı doğru şekilde al - düzeltildi
            const amount = typeof finance.amount === "string" ? 
              parseFloat(finance.amount.replace(/[^\d.-]/g, '')) : 
              (typeof finance.amount === "number" ? finance.amount : 0);
            
            if (!isNaN(amount) && amount > 0) {
              tourExpenseGroups[tourId].amount += amount;
              tourExpenseGroups[tourId].originalData.expenses.push(finance);
            }
          }
        } else {
          // Eğer tur bulunamadıysa normal gider olarak ekle
          serialNumber = `F${expenseCounter++}`;
          
          // Tutarı doğru şekilde al
          const amount = typeof finance.amount === "string" ? 
            parseFloat(finance.amount.replace(/[^\d.-]/g, '')) : 
            (typeof finance.amount === "number" ? finance.amount : 0);
          
          regularFinancialTransactions.push({
            id: finance.id,
            type: 'finance',
            date: displayDate,
            serialNumber: serialNumber,
            name: finance.type === 'income' ? 'Gelir Kaydı' : 'Gider Kaydı',
            customerName: finance.description || '-',
            amount: amount,
            currency: finance.currency,
            status: finance.type,
            category: finance.category || 'Genel',
            originalData: finance
          });
        }
      } else {
        // Normal finans kaydı için gelir veya gidere göre sıralı numara ata
        if (finance.type === 'income') {
          serialNumber = `F${incomeCounter++}`;
        } else {
          serialNumber = `F${expenseCounter++}`;
        }
        
        // Tutarı doğru şekilde al
        const amount = typeof finance.amount === "string" ? 
          parseFloat(finance.amount.replace(/[^\d.-]/g, '')) : 
          (typeof finance.amount === "number" ? finance.amount : 0);
        
        regularFinancialTransactions.push({
          id: finance.id,
          type: 'finance',
          date: displayDate,
          serialNumber: serialNumber,
          name: finance.type === 'income' ? 'Gelir Kaydı' : 'Gider Kaydı',
          customerName: finance.description || '-',
          amount: amount,
          currency: finance.currency,
          status: finance.type,
          category: finance.category || 'Genel',
          originalData: finance
        });
      }
    });
    
    // Sadece gider tutarı olan (0'dan büyük) grupları filtrele
    const tourExpenseTransactions = Object.values(tourExpenseGroups).filter(
      (group: any) => group.amount > 0
    );
    
    // Tüm işlemleri birleştir - tarih filtresi yok
    return [...tourTransactions, ...tourExpenseTransactions, ...regularFinancialTransactions];
  })()
  .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const totalPages = Math.ceil(combinedTransactions.length / PAGE_SIZE);

  // Her para birimi için toplamı göster, completed'da sadece totalPrice, partial'da ödenen kısımlar ve ödenen aktiviteler
  const getTourTotalString = (tour) => {
    const totals = {};
    
    // Tur ödeme durumuna göre toplamları hesapla
    if (tour.paymentStatus === 'completed') {
      // Tamamlanmış tur için toplam tutarı göster
      const cur = tour.currency || 'TRY';
      const totalAmount = Number(tour.totalPrice) || 0;
      
      if (totalAmount > 0) {
        totals[cur] = (totals[cur] || 0) + totalAmount;
      }
    } 
    else if (tour.paymentStatus === 'partial') {
      // Kısmi ödemeli turda, ödenen kısmı göster
      const paidCur = tour.partialPaymentCurrency || tour.currency || 'TRY';
      const paidAmount = Number(tour.partialPaymentAmount) || 0;
      
      if (paidAmount > 0) {
        totals[paidCur] = (totals[paidCur] || 0) + paidAmount;
      }
      
      // Varsa aktivitelerden ödenen kısımları da ekle
      if (Array.isArray(tour.activities)) {
        tour.activities.forEach(act => {
          if (act.partialPaymentAmount) {
            const cur = act.partialPaymentCurrency || act.currency || tour.currency || 'TRY';
            const amount = Number(act.partialPaymentAmount) || 0;
            
            if (amount > 0) {
              totals[cur] = (totals[cur] || 0) + amount;
            }
          }
        });
      }
    }
    else if (tour.paymentStatus === 'pending') {
      // Beklemedeki turlar için sıfır yerine toplam tutar gösterilir (ödenmemiş)
      const cur = tour.currency || 'TRY';
      const totalAmount = Number(tour.totalPrice) || 0;
      
      if (totalAmount > 0) {
        totals[cur] = (totals[cur] || 0) + totalAmount;
      }
    }
    
    // formatCurrencyGroups fonksiyonunu kullanarak formatlı string döndür
    if (Object.keys(totals).length === 0) {
      return '-'; // Tutar yoksa - göster
    }
    
    return formatCurrencyGroups(totals);
  };

  // Ana ekranda sadece göstergeler olacak, menü butonları kaldırıldı

  return (
    <div className="space-y-6 w-full max-w-[1350px] mx-auto px-[32px] mt-10 sm:px-4">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Finansal Gelir */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-3 pb-6 px-4 relative">
            <div className="flex flex-col items-start justify-start pt-0">
              <div>
                <div className="flex flex-col items-start mb-0.5">
  <span className="bg-green-100 p-2 rounded-full mb-0.5"><DollarSign className="h-4 w-4 text-green-500" /></span>
  <h3 className="text-base font-bold text-muted-foreground text-left">Finansal Gelir <span className="block text-xs font-normal text-muted-foreground">(Son 30 gün)</span></h3>
</div>
                <div>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrencyGroups(incomeByCurrency)}
                  </p>
                </div>
              </div>
              
            </div>
          </CardContent>
        </Card>
        {/* Finansal Gider */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-3 pb-6 px-4 relative">
            <div className="flex flex-col items-start justify-start pt-0">
              <div>
                <div className="flex flex-col items-start mb-0.5">
  <span className="bg-red-100 p-2 rounded-full mb-0.5"><DollarSign className="h-4 w-4 text-red-500" /></span>
  <h3 className="text-base font-bold text-muted-foreground text-left">Finansal Gider <span className="block text-xs font-normal text-muted-foreground">(Son 30 gün)</span></h3>
</div>
                <div>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrencyGroups(expenseByCurrency)}
                  </p>
                </div>
              </div>
              
            </div>
          </CardContent>
        </Card>
        {/* Tur Geliri */}
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="pt-3 pb-6 px-4 relative">
            <div className="flex flex-col items-start justify-start pt-0">
              <div>
                <div className="flex flex-col items-start mb-0.5">
  <span className="bg-indigo-100 p-2 rounded-full mb-0.5"><Globe className="h-4 w-4 text-indigo-500" /></span>
  <h3 className="text-base font-bold text-muted-foreground text-left">Tur Geliri <span className="block text-xs font-normal text-muted-foreground">(Ödenen)</span></h3>
</div>
                <p className="text-2xl font-bold text-indigo-600">
                  {formatCurrencyGroups(tourIncomeByCurrency)}
                </p>
              </div>
              
            </div>
          </CardContent>
        </Card>
        {/* Tur Gideri */}
        <Card className="border-l-4 border-l-fuchsia-500">
          <CardContent className="pt-3 pb-6 px-4 relative">
            <div className="flex flex-col items-start justify-start pt-0">
              <div>
                <div className="flex flex-col items-start mb-0.5">
  <span className="bg-fuchsia-100 p-2 rounded-full mb-0.5"><BarChart2 className="h-4 w-4 text-fuchsia-500" /></span>
  <h3 className="text-base font-bold text-muted-foreground text-left">Tur Gideri <span className="block text-xs font-normal text-muted-foreground">(Toplam)</span></h3>
</div>
                <p className="text-2xl font-bold text-fuchsia-600">
                  {formatCurrencyGroups(tourExpenseByCurrency)}
                </p>
              </div>
              
            </div>
          </CardContent>
        </Card>
        {/* Toplam Müşteri */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-3 pb-6 px-4 relative">
            <div className="flex flex-col items-start justify-start pt-0">
              <div>
                <div className="flex flex-col items-start mb-0.5">
  <span className="bg-blue-100 p-2 rounded-full mb-0.5"><Users className="h-4 w-4 text-blue-500" /></span>
  <h3 className="text-base font-bold text-muted-foreground text-left">Toplam Müşteriler</h3>
</div>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
              
            </div>
          </CardContent>
        </Card>
        {/* Yaklaşan Turlar */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-3 pb-6 px-4 relative">
            <div className="flex flex-col items-start justify-start pt-0">
              <div>
                <div className="flex flex-col items-start mb-0.5">
  <span className="bg-amber-100 p-2 rounded-full mb-0.5"><Calendar className="h-4 w-4 text-amber-500" /></span>
  <h3 className="text-base font-bold text-muted-foreground text-left">Yaklaşan Turlar <span className="block text-xs font-normal text-muted-foreground">(Tarih: Bugünden Sonra)</span></h3>
</div>
                <p className="text-2xl font-bold">{upcomingTours.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Son Tur Satışları Tablosu */}
      <Card className="mt-8">
        <CardHeader className="pb-2">
          <div className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-[#00a1c6]">Son Tur Satışları</CardTitle>
              <CardDescription>Tur satışları ve ilgili giderler</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="date-filter-tours"
                  checked={isTourDateFilterActive}
                  onCheckedChange={(checked) => setIsTourDateFilterActive(checked)}
                />
                <label htmlFor="date-filter-tours" className="text-sm font-medium text-muted-foreground">
                  Tarih filtresini etkinleştir
                </label>
              </div>
              <DatePickerWithRange
                date={tourDateRange}
                setDate={setTourDateRange}
                className={!isTourDateFilterActive ? "opacity-50 pointer-events-none" : ""}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="border-t border-gray-200 w-full my-2"></div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 px-3 text-left font-bold">SATIŞ NO</th>
                  <th className="py-2 px-3 text-left font-bold">TARİH</th>
                  <th className="py-2 px-3 text-left font-bold">İŞLEM TİPİ</th>
                  <th className="py-2 px-3 text-left font-bold">AÇIKLAMA</th>
                  <th className="py-2 px-3 text-left font-bold">DURUM</th>
                  <th className="py-2 px-3 text-left font-bold">TUTAR</th>
                  <th className="py-2 px-3 text-left font-bold">KALAN ÖDEME</th>
                  <th className="py-2 px-3 text-left font-bold">İŞLEM</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Sadece tur kayıtları ve tur giderleri
                  const combinedTourTransactions = combinedTransactions
                    .filter(transaction => 
                      transaction.type === 'tour' || // Tur satışları
                      (transaction.type === 'finance' && transaction.originalData.relatedTourId) // Tur giderleri
                    )
                    // Tur tarihi filtreleme
                    .filter(transaction => {
                      if (!isTourDateFilterActive || !tourDateRange || !tourDateRange.from) return true;
                      const transactionDate = new Date(transaction.date);
                      // Bitiş tarihi undefined ise sadece başlangıç tarihiyle kontrol et
                      if (!tourDateRange.to) {
                        return transactionDate >= tourDateRange.from;
                      }
                      // Her ikisi de tanımlı ise aralığı kontrol et
                      return transactionDate >= tourDateRange.from && transactionDate <= tourDateRange.to;
                    })
                    .sort((a, b) => {
                      // Önce tarih sıralaması
                      const dateCompare = new Date(b.date) - new Date(a.date);
                      if (dateCompare !== 0) return dateCompare;
                      
                      // Aynı tarihli olanları satış numarası ve ilgili giderleri birlikte göstermek için sırala
                      if (a.type === 'tour' && b.type === 'finance' && 
                          b.originalData.relatedTourId === a.id) {
                        return -1; // Tur satışı önce, gideri sonra
                      }
                      if (b.type === 'tour' && a.type === 'finance' && 
                          a.originalData.relatedTourId === b.id) {
                        return 1; // Tur satışı önce, gideri sonra
                      }
                      
                      // Diğer durumlarda varsayılan sıralama
                      return 0;
                    });

                  const totalTourPages = Math.ceil(combinedTourTransactions.length / PAGE_SIZE);
                  const startTourIndex = (currentPage - 1) * PAGE_SIZE;
                  const pagedTourTransactions = combinedTourTransactions.slice(startTourIndex, startTourIndex + PAGE_SIZE);

                  if (pagedTourTransactions && pagedTourTransactions.length > 0) {
                    return pagedTourTransactions.map((transaction) => {
                      // Tur satışı veya tur gideri için farklı görünüm
                      if (transaction.type === 'tour') {
                        // Tur satışı için kalan ödeme hesaplama
                        const totalPaid = transaction.status === "partial" ? 
                          Number(transaction.originalData.partialPaymentAmount) || 0 : 
                          (transaction.status === "completed" ? Number(transaction.amount) || 0 : 0);
                        const totalLeft = (Number(transaction.amount) || 0) - totalPaid;
                        
                        // Her bir satır için benzersiz key oluştur
                        const rowKey = `tour-${transaction.id}-${transaction.serialNumber}`;
                        
                        return (
                          <tr key={rowKey} className="border-b last:border-0 hover:bg-gray-100 transition bg-indigo-50">
                            <td className="py-2 px-3 font-mono text-lg font-bold">
                              <span className="text-indigo-600">
                                {transaction.serialNumber}
                              </span>
                            </td>
                            <td className="py-2 px-3">{new Date(transaction.date).toLocaleDateString("tr-TR")}</td>
                            <td className="py-2 px-3">
                              <span className="bg-white border border-indigo-500 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">Tur</span>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex flex-col">
                                <span className="font-semibold">{transaction.customerName || "İsimsiz Müşteri"}</span>
                                <span className="text-xs text-gray-500">
                                  {transaction.selectedTourName || transaction.destination || transaction.originalData.selectedTourName || "Belirtilmemiş"}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              {transaction.status === "completed" && (
                                <span className="bg-white border border-green-500 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Tamamlandı</span>
                              )}
                              {transaction.status === "pending" && (
                                <span className="bg-white border border-orange-500 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">Beklemede</span>
                              )}
                              {transaction.status === "partial" && (
                                <span className="bg-white border border-yellow-500 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">Kısmi</span>
                              )}
                              {transaction.status === "refunded" && (
                                <span className="bg-white border border-blue-500 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">İade</span>
                              )}
                              {!transaction.status && (
                                <span className="bg-white border border-gray-500 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">Bilinmiyor</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {getTourTotalString(transaction.originalData)}
                            </td>
                            <td className="py-2 px-3">
                              {formatCurrency(totalLeft, transaction.currency)}
                            </td>
                            <td className="py-2 px-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => onNavigate(`edit-tour-${transaction.id}`)}
                              >
                                Düzenle
                              </Button>
                            </td>
                          </tr>
                        );
                      } else {
                        // Tur ile ilişkili gider kaydı
                        const relatedTour = toursData.find(t => t.id === transaction.originalData.relatedTourId);
                        
                        // Her bir gider satırı için benzersiz key oluştur
                        const rowKey = `expense-${transaction.id}-${transaction.serialNumber}`;
                        
                        return (
                          <tr key={rowKey} className="border-b last:border-0 hover:bg-gray-100 transition bg-red-50">
                            <td className="py-2 px-3 font-mono text-lg font-bold">
                              <span className="text-red-600">
                                {transaction.serialNumber}
                              </span>
                            </td>
                            <td className="py-2 px-3">{new Date(transaction.date).toLocaleDateString("tr-TR")}</td>
                            <td className="py-2 px-3">
                              <span className="bg-white border border-red-500 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Gider</span>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex flex-col">
                                <span className="font-semibold">{relatedTour?.customerName || "Müşteri"} - Tur Gideri</span>
                                <span className="text-xs text-gray-500">
                                  {relatedTour?.selectedTourName ? `${relatedTour.selectedTourName} - ` : ''}
                                  Detay için finansal kayıtları ziyaret edin
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <span className="bg-white border border-indigo-500 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">Tur Gideri</span>
                            </td>
                            <td className="py-2 px-3">
                              {transaction.expensesByCurrency ? 
                                formatCurrencyGroups(transaction.expensesByCurrency) : 
                                formatCurrency(transaction.amount || 0, transaction.currency)}
                            </td>
                            <td className="py-2 px-3">-</td>
                            <td className="py-2 px-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => onNavigate(`edit-financial-${transaction.id}`)}
                              >
                                Düzenle
                              </Button>
                            </td>
                          </tr>
                        );
                      }
                    });
                  } else {
                    return (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-muted-foreground">Kayıt yok</td>
                      </tr>
                    );
                  }
                })()}
              </tbody>
            </table>
            <div className="border-b border-gray-200 w-full my-2"></div>
            
            <div className="flex justify-between items-center mt-4">
              {(() => {
                // Sadece tur kayıtları ve giderleri için sayfalama bilgisi
                const combinedTourTransactions = combinedTransactions.filter(transaction => 
                  transaction.type === 'tour' || (transaction.type === 'finance' && transaction.originalData.relatedTourId)
                );
                const totalTourPages = Math.ceil(combinedTourTransactions.length / PAGE_SIZE);
                
                return (
                  <>
                    <span className="text-xs text-muted-foreground">
                      Toplam {combinedTourTransactions.length} tur kaydından {Math.min(PAGE_SIZE, combinedTourTransactions.length)} tanesi gösteriliyor
                    </span>
                    
                    {/* Sayfalama */}
                    <div className="flex items-center">
                      {totalTourPages > 1 && (
                        <div className="flex justify-center items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(currentPage - 1)}
                          >
                            Önceki
                          </Button>
                          {Array.from({ length: totalTourPages }).map((_, idx) => (
                            <Button
                              key={idx}
                              variant={currentPage === idx + 1 ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(idx + 1)}
                            >
                              {idx + 1}
                            </Button>
                          ))}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={currentPage === totalTourPages} 
                            onClick={() => setCurrentPage(currentPage + 1)}
                          >
                            Sonraki
                          </Button>
                        </div>
                      )}
                      
                      <div className="ml-4">
                        <Button variant="outline" size="sm" onClick={() => onNavigate("data-view")}>Tümünü Gör</Button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Son Finansal Kayıtlar Tablosu - Sadece tur ile ilişkisiz olanlar */}
      <Card className="mt-8">
        <CardHeader className="pb-2">
          <div className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-[#00a1c6]">Son Finansal Kayıtlar</CardTitle>
              <CardDescription>Tur ile ilgisi olmayan gelir ve gider işlemleri</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="date-filter-financial"
                  checked={isFinancialDateFilterActive}
                  onCheckedChange={(checked) => setIsFinancialDateFilterActive(checked)}
                />
                <label htmlFor="date-filter-financial" className="text-sm font-medium text-muted-foreground">
                  Tarih filtresini etkinleştir
                </label>
              </div>
              <DatePickerWithRange
                date={financialDateRange}
                setDate={setFinancialDateRange}
                className={!isFinancialDateFilterActive ? "opacity-50 pointer-events-none" : ""}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="border-t border-gray-200 w-full my-2"></div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 px-3 text-left font-bold">İŞLEM NO</th>
                  <th className="py-2 px-3 text-left font-bold">TARİH</th>
                  <th className="py-2 px-3 text-left font-bold">İŞLEM TİPİ</th>
                  <th className="py-2 px-3 text-left font-bold">AÇIKLAMA</th>
                  <th className="py-2 px-3 text-left font-bold">KATEGORİ</th>
                  <th className="py-2 px-3 text-left font-bold">TUTAR</th>
                  <th className="py-2 px-3 text-left font-bold">İŞLEM</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Sadece tur ile ilgisi olmayan finans kayıtları
                  const financialOnlyTransactions = combinedTransactions
                    .filter(transaction => 
                      transaction.type === 'finance' && 
                      !transaction.originalData.relatedTourId  // Tur ile ilgisi olmayanlar
                    )
                    // Finansal kayıtlar için tarih filtresini uygula
                    .filter(transaction => {
                      if (!isFinancialDateFilterActive || !financialDateRange || !financialDateRange.from) return true;
                      const transactionDate = new Date(transaction.date);
                      // Bitiş tarihi undefined ise sadece başlangıç tarihiyle kontrol et
                      if (!financialDateRange.to) {
                        return transactionDate >= financialDateRange.from;
                      }
                      // Her ikisi de tanımlı ise aralığı kontrol et
                      return transactionDate >= financialDateRange.from && transactionDate <= financialDateRange.to;
                    })
                    .sort((a, b) => new Date(b.date) - new Date(a.date));

                  const totalFinancialPages = Math.ceil(financialOnlyTransactions.length / PAGE_SIZE);
                  const startFinancialIndex = (currentFinancialPage - 1) * PAGE_SIZE;
                  const pagedFinancialTransactions = financialOnlyTransactions.slice(startFinancialIndex, startFinancialIndex + PAGE_SIZE);

                  if (pagedFinancialTransactions && pagedFinancialTransactions.length > 0) {
                    return pagedFinancialTransactions.map((transaction) => {
                      // İşlem tipine göre arka plan rengi belirleme
                      const rowBgColor = transaction.status === 'income' ? 
                        "bg-green-50" : // Gelir için yeşil
                        "bg-red-50";    // Gider için kırmızı
                      
                      // İşlem numarası rengi
                      const serialNumberColor = transaction.status === 'income' ? 
                        "text-green-600" : // Gelir için yeşil
                        "text-red-600";    // Gider için kırmızı
                      
                      return (
                        <tr key={transaction.id} className={`border-b last:border-0 hover:bg-gray-100 transition ${rowBgColor}`}>
                          <td className="py-2 px-3 font-mono text-lg font-bold">
                            <span className={serialNumberColor}>
                              {transaction.serialNumber}
                            </span>
                          </td>
                          <td className="py-2 px-3">{new Date(transaction.date).toLocaleDateString("tr-TR")}</td>
                          <td className="py-2 px-3">
                            {transaction.status === 'income' ? (
                              <span className="bg-white border border-green-500 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Gelir</span>
                            ) : (
                              <span className="bg-white border border-red-500 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Gider</span>
                            )}
                          </td>
                          <td className="py-2 px-3">{transaction.customerName}</td>
                          <td className="py-2 px-3">
                            <span className={`bg-white border ${transaction.status === 'income' ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'} px-3 py-1 rounded-full text-xs font-semibold`}>
                              {transaction.category || "Genel"}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </td>
                          <td className="py-2 px-3">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onNavigate(`edit-financial-${transaction.id}`)}
                            >
                              Düzenle
                            </Button>
                          </td>
                        </tr>
                      );
                    });
                  } else {
                    return (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-muted-foreground">Kayıt yok</td>
                      </tr>
                    );
                  }
                })()}
              </tbody>
            </table>
            <div className="border-b border-gray-200 w-full my-2"></div>
            
            <div className="flex justify-between items-center mt-4">
              {(() => {
                // Sadece finans kayıtları için sayfalama bilgisi
                const financialOnlyTransactions = combinedTransactions.filter(transaction => 
                  transaction.type === 'finance' && !transaction.originalData.relatedTourId
                );
                const totalFinancialPages = Math.ceil(financialOnlyTransactions.length / PAGE_SIZE);
                
                return (
                  <>
                    <span className="text-xs text-muted-foreground">
                      Toplam {financialOnlyTransactions.length} finansal kayıttan {Math.min(PAGE_SIZE, financialOnlyTransactions.length)} tanesi gösteriliyor
                    </span>
                    
                    {/* Sayfalama */}
                    <div className="flex items-center">
                      {totalFinancialPages > 1 && (
                        <div className="flex justify-center items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={currentFinancialPage === 1} 
                            onClick={() => setCurrentFinancialPage(currentFinancialPage - 1)}
                          >
                            Önceki
                          </Button>
                          {Array.from({ length: totalFinancialPages }).map((_, idx) => (
                            <Button
                              key={idx}
                              variant={currentFinancialPage === idx + 1 ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentFinancialPage(idx + 1)}
                            >
                              {idx + 1}
                            </Button>
                          ))}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={currentFinancialPage === totalFinancialPages} 
                            onClick={() => setCurrentFinancialPage(currentFinancialPage + 1)}
                          >
                            Sonraki
                          </Button>
                        </div>
                      )}
                      
                      <div className="ml-4">
                        <Button variant="outline" size="sm" onClick={() => onNavigate("data-view")}>Tümünü Gör</Button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
