"use client"

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Calendar, Globe, FileText, BarChart2, Settings, Save } from "lucide-react"
import { formatCurrency } from "@/lib/data-utils"
import { Button } from "@/components/ui/button"

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

  // Tur Gideri: Her döviz için ayrı ayrı topla
  const tourExpenseByCurrency = toursData.reduce((acc, tour) => {
    if (Array.isArray(tour.expenses)) {
      tour.expenses.forEach((expense) => {
        const currency = expense.currency || tour.currency || "TRY";
        const amount = Number.parseFloat(expense.amount?.toString() || "0") || 0;
        acc[currency] = (acc[currency] || 0) + amount;
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

  // Son İşlemler için sayfalama
  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  
  // Tur ve finans verilerini birleştir ve tarihe göre sırala
  const combinedTransactions = [
    ...toursData.map(tour => ({
      id: tour.id,
      type: 'tour',
      date: tour.tourDate,
      serialNumber: tour.serialNumber || tour.id?.slice(-4) || "INV",
      name: tour.tourName,
      customerName: tour.customerName,
      amount: tour.totalPrice,
      currency: tour.currency,
      status: tour.paymentStatus,
      originalData: tour
    })),
    ...(() => {
      // Gelir ve giderler için ayrı sayaçlar oluştur ve 1'den başlat
      let incomeCounter = 1;
      let expenseCounter = 1;
      
      return financialData.map((finance) => {
        // Tur giderleri için ilgili turun seri numarasını kullan
        let serialNumber;
        let relatedTourSerialNumber = "";
        let displayDate = finance.date; // Varsayılan olarak işlem tarihi
        
        // Eğer ilgili bir tura ait gider ise, turun seri numarasını ve başlangıç tarihini al
        if (finance.relatedTourId && finance.type === "expense") {
          const relatedTour = toursData.find(t => t.id === finance.relatedTourId);
          if (relatedTour) {
            relatedTourSerialNumber = relatedTour.serialNumber || relatedTour.id?.slice(-4) || "INV";
            serialNumber = `F${relatedTourSerialNumber}`;
            
            // Tur giderleri için turun başlangıç tarihini göster
            if (finance.category === "Tur Gideri" && relatedTour.tourDate) {
              displayDate = relatedTour.tourDate;
            }
          } else {
            // Tura ait gider ama tur bulunamadıysa sıralı numara ata
            serialNumber = `F${expenseCounter++}`;
          }
        } else {
          // Normal finans kaydı için gelir veya gidere göre sıralı numara ata
          if (finance.type === 'income') {
            serialNumber = `F${incomeCounter++}`;
          } else {
            serialNumber = `F${expenseCounter++}`;
          }
        }
        
        return {
          id: finance.id,
          type: 'finance',
          date: displayDate, // İşlem tarihi veya tur başlangıç tarihi
          serialNumber: serialNumber,
          name: finance.type === 'income' ? 'Gelir Kaydı' : 'Gider Kaydı',
          customerName: finance.description || '-',
          amount: finance.amount,
          currency: finance.currency,
          status: finance.type,
          category: finance.category || 'Genel',
          originalData: finance,
          relatedTourSerialNumber
        };
      });
    })()
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const totalPages = Math.ceil(combinedTransactions.length / PAGE_SIZE);
  const pagedTransactions = combinedTransactions.slice(0, PAGE_SIZE);

  // Her para birimi için toplamı göster, completed'da sadece totalPrice, partial'da ödenen kısımlar ve ödenen aktiviteler
  const getTourTotalString = (tour) => {
    const totals = {};
    if (tour.paymentStatus === 'partial') {
      const paidCur = tour.partialPaymentCurrency || tour.currency || 'TRY';
      const paidAmount = Number(tour.partialPaymentAmount) || 0;
      totals[paidCur] = (totals[paidCur] || 0) + paidAmount;
      if (Array.isArray(tour.activities)) {
        tour.activities.forEach(act => {
          if (act.partialPaymentAmount) {
            const cur = act.partialPaymentCurrency || act.currency || tour.currency || 'TRY';
            totals[cur] = (totals[cur] || 0) + Number(act.partialPaymentAmount);
          }
        });
      }
    } else if (tour.paymentStatus === 'completed') {
      const cur = tour.currency || 'TRY';
      totals[cur] = (totals[cur] || 0) + (Number(tour.totalPrice) || 0);
      // completed'da aktiviteler ayrıca eklenmez!
    }
    // Diğer durumlarda gelir eklenmez
    return Object.entries(totals)
      .filter(([_, val]) => val > 0)
      .map(([cur, val]) => `${val.toLocaleString('tr-TR')} ${cur}`)
      .join(' + ') || '-';
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
                  {Object.entries(incomeByCurrency).map(([currency, amount]) => (
                    <p key={currency} className="text-xl font-bold text-green-600">
                      {formatCurrency(amount, currency)}
                    </p>
                  ))}
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
                  {Object.entries(expenseByCurrency).map(([currency, amount]) => (
                    <p key={currency} className="text-xl font-bold text-red-600">
                      {formatCurrency(amount, currency)}
                    </p>
                  ))}
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
                {Object.entries(tourIncomeByCurrency).map(([currency, amount]) => (
                  <p key={currency} className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(amount, currency)}
                  </p>
                ))}
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
                {Object.entries(tourExpenseByCurrency).map(([currency, amount]) => (
                  <p key={currency} className="text-2xl font-bold text-fuchsia-600">
                    {formatCurrency(amount, currency)}
                  </p>
                ))}
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

      {/* Son İşlemler Tablosu */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg text-[#00a1c6]">Son İşlemler</CardTitle>
          <CardDescription>Tur satışları ve finans kayıtları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 px-3 text-left font-semibold">İŞLEM NO</th>
                  <th className="py-2 px-3 text-left font-semibold">TİP</th>
                  <th className="py-2 px-3 text-left font-semibold">AÇIKLAMA</th>
                  <th className="py-2 px-3 text-left font-semibold">TARİH</th>
                  <th className="py-2 px-3 text-left font-semibold">TUTAR</th>
                  <th className="py-2 px-3 text-left font-semibold">DURUM</th>
                  <th className="py-2 px-3 text-left font-semibold">İŞLEM</th>
                </tr>
              </thead>
              <tbody>
                {pagedTransactions && pagedTransactions.length > 0 ? (
                  pagedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                      <td className="py-2 px-3 font-mono text-lg font-bold">
                        {/* İşlem numarasının rengini türüne göre değiştir */}
                        <span className={
                          transaction.type === 'tour' ? 
                            "text-purple-600" : /* Tur satışı mor */
                          transaction.originalData.relatedTourId ? 
                            "text-purple-600" : /* Tur gideri mor */
                          transaction.status === 'income' ?
                            "text-green-600" : /* Gelir yeşil */
                          "text-red-600" /* Gider kırmızı */
                        }>
                          {transaction.serialNumber}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {transaction.type === 'tour' ? (
                          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">Tur</span>
                        ) : transaction.status === 'income' ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Gelir</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Gider</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {transaction.type === 'tour' ? (
                          <span>
                            {transaction.customerName || "İsimsiz Müşteri"} - {transaction.originalData.destinationId ? 
                            (() => {
                              try {
                                const destinationsData = localStorage.getItem('destinations');
                                if (destinationsData) {
                                  const destinations = JSON.parse(destinationsData);
                                  const destination = destinations.find(d => d.id === transaction.originalData.destinationId);
                                  return destination ? destination.name : transaction.name || "Belirtilmemiş Destinasyon";
                                }
                              } catch (e) {
                                console.error("Destinasyon bilgisi alınamadı:", e);
                              }
                              return transaction.name || "Belirtilmemiş Destinasyon";
                            })() 
                            : transaction.name || "Belirtilmemiş Destinasyon"}
                          </span>
                        ) : transaction.status === 'expense' ? (
                          <span>
                            {(() => {
                              // Eğer tur gideri ise, ilgili turun müşteri adını göster
                              if (transaction.originalData.relatedTourId && transaction.originalData.category === "Tur Gideri") {
                                const relatedTour = toursData.find(t => t.id === transaction.originalData.relatedTourId);
                                if (relatedTour) {
                                  // Gider açıklaması kısaltılıp sadece gider tipini göster
                                  const expenseName = transaction.originalData.description?.split(' - ')[1] || "Gider";
                                  return `${relatedTour.customerName || "Müşteri"} - ${expenseName}`;
                                }
                              }
                              // Normal gider
                              return `${transaction.customerName || "Genel"} - ${transaction.originalData.description || "Gider"}`;
                            })()}
                          </span>
                        ) : (
                          <span>{transaction.customerName}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">{new Date(transaction.date).toLocaleDateString("tr-TR")}</td>
                      <td className="py-2 px-3">
                        {transaction.type === 'tour' 
                          ? getTourTotalString(transaction.originalData)
                          : formatCurrency(transaction.amount, transaction.currency)}
                      </td>
                      <td className="py-2 px-3">
                        {transaction.type === 'tour' ? (
                          <>
                            {transaction.status === "completed" && (
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Tamamlandı</span>
                            )}
                            {transaction.status === "pending" && (
                              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">Beklemede</span>
                            )}
                            {transaction.status === "partial" && (
                              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">Kısmi</span>
                            )}
                            {transaction.status === "refunded" && (
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">İade</span>
                            )}
                            {!transaction.status && (
                              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">Bilinmiyor</span>
                            )}
                          </>
                        ) : (
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">{transaction.category}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onNavigate(transaction.type === 'tour' 
                            ? `edit-tour-${transaction.id}` 
                            : `edit-financial-${transaction.id}`
                          )}
                        >
                          Düzenle
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-muted-foreground">Kayıt yok</td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Sayfalama */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                  Önceki
                </Button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <Button
                    key={idx}
                    variant={currentPage === idx + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                  Sonraki
                </Button>
              </div>
            )}
            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
              <span>Toplam {combinedTransactions.length} işlemden {Math.min(PAGE_SIZE, combinedTransactions.length)} tanesi gösteriliyor</span>
              <Button variant="outline" size="sm" onClick={() => onNavigate("data-view")}>Tümünü Gör</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yaklaşan Turların Finansal Durumu Tablosu */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg text-[#00a1c6]">Yaklaşan Turların Finansal Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 px-3 text-left font-semibold">SATIŞ NO</th>
                  <th className="py-2 px-3 text-left font-semibold">MÜŞTERİ</th>
                  <th className="py-2 px-3 text-left font-semibold">TUR TARİHİ</th>
                  <th className="py-2 px-3 text-left font-semibold">ALINAN ÖDEME</th>
                  <th className="py-2 px-3 text-left font-semibold">KALAN ÖDEME</th>
                  <th className="py-2 px-3 text-left font-semibold">YAPILAN GİDER</th>
                  <th className="py-2 px-3 text-left font-semibold">DURUM</th>
                  <th className="py-2 px-3 text-left font-semibold">İŞLEM</th>
                </tr>
              </thead>
              <tbody>
                {upcomingTours && upcomingTours.length > 0 ? (
                  upcomingTours.map((tour) => {
                    const totalPaid = tour.paymentStatus === "partial" ? Number(tour.partialPaymentAmount) || 0 : (tour.paymentStatus === "completed" ? Number(tour.totalPrice) || 0 : 0);
                    const totalLeft = (Number(tour.totalPrice) || 0) - totalPaid;
                    const totalExpense = Array.isArray(tour.expenses) ? tour.expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) : 0;
                    return (
                      <tr key={tour.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                        <td className="py-2 px-3 font-mono text-lg font-bold text-[#00a1c6]">{tour.serialNumber || tour.id?.slice(-4) || "INV"}</td>
                        <td className="py-2 px-3">{tour.customerName}</td>
                        <td className="py-2 px-3">{new Date(tour.tourDate).toLocaleDateString("tr-TR")}</td>
                        <td className="py-2 px-3">{getTourTotalString(tour)}</td>
                        <td className="py-2 px-3">{formatCurrency(totalLeft, tour.currency)}</td>
                        <td className="py-2 px-3">{formatCurrency(totalExpense, tour.currency)}</td>
                        <td className="py-2 px-3">
                          {tour.paymentStatus === "completed" && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Tamamlandı</span>}
                          {tour.paymentStatus === "pending" && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">Beklemede</span>}
                          {tour.paymentStatus === "partial" && <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">Kısmi</span>}
                          {tour.paymentStatus === "refunded" && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">İade</span>}
                          {!tour.paymentStatus && <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">Bilinmiyor</span>}
                        </td>
                        <td className="py-2 px-3">
                          <Button size="sm" variant="outline" onClick={() => onNavigate(`edit-tour-${tour.id || tour.serialNumber}`)}>Düzenle</Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-muted-foreground">Yaklaşan tur kaydı yok</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
