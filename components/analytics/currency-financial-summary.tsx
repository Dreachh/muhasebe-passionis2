"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/data-utils"

// Türleri tanımlayalım
interface DataItem {
  id?: string;
  type?: "income" | "expense";
  amount?: number | string;
  currency?: string;
  category?: string;
  date?: string | Date;
  description?: string;
  paymentMethod?: string;
  relatedTourId?: string;
  tourDate?: string | Date;
  tourName?: string;
  totalPrice?: number | string;
  customerName?: string;
  serialNumber?: string;
  [key: string]: any; // Diğer özellikleri de kabul etmek için
}

interface FinancialSummary {
  income: number;
  expense: number;
  tourIncome: number;
  tourExpenses: number;
  profit: number;
  totalIncome: number;
  totalProfit: number;
  balance: number;
}

// Arayüzleri güncelliyorum
interface CurrencyFinancialSummaryProps {
  onCancel?: () => void;
  currency: string;
  financialData: DataItem[];
  toursData: DataItem[];
}

// onCancel fonksiyonu ana sayfaya yönlendirecek şekilde güncellendi
export function CurrencyFinancialSummary({ 
  onCancel = () => { window.location.hash = '#main-dashboard'; }, 
  currency, 
  financialData, 
  toursData 
}: CurrencyFinancialSummaryProps) {
  // Para birimine göre finansal özet hesaplama
  const getFinancialSummaryByCurrency = (cur: string): FinancialSummary => {
    const filterByCurrency = (item: { currency?: string }) => {
      if (cur === 'all') return true;
      return item && item.currency === cur;
    };

    // Gelirler
    const income = financialData
      .filter(item => item && item.type === "income" && filterByCurrency(item))
      .reduce((sum, item) => sum + (Number.parseFloat(item?.amount?.toString() || '0') || 0), 0);
    
    // Giderler (tur giderleri dahil)
    const expense = financialData
      .filter(item => item && item.type === "expense" && filterByCurrency(item))
      .reduce((sum, item) => sum + (Number.parseFloat(item?.amount?.toString() || '0') || 0), 0);
    
    // Tur giderleri (finansal kayıtlarda tur gideri olarak işaretlenenler)
    const tourExpenses = financialData
      .filter(item => item && item.type === "expense" && item.category === "Tur Gideri" && filterByCurrency(item))
      .reduce((sum, item) => sum + (Number.parseFloat(item?.amount?.toString() || '0') || 0), 0);
    
    // Tur gelirleri
    const tourIncome = toursData
      .filter(tour => tour && filterByCurrency(tour))
      .reduce((sum, tour) => sum + (Number.parseFloat(tour?.totalPrice?.toString() || '0') || 0), 0);
    
    return {
      income,
      expense,
      tourIncome,
      tourExpenses,
      profit: income - expense,
      totalIncome: income + tourIncome,
      totalProfit: income + tourIncome - expense,
      balance: income + tourIncome - expense, // Kasa kalan miktar
    };
  };

  // Eğer 'all' seçiliyse, sistemdeki tüm para birimlerini bul ve her biri için ayrı özet göster
  if (currency === 'all') {
    // Tüm kullanılan para birimlerini normalize ederek bul
    const allCurrenciesSet = new Set<string>();
    financialData.forEach(item => {
      if (item && item.currency) allCurrenciesSet.add(item.currency.toUpperCase());
    });
    toursData.forEach(item => {
      if (item && item.currency) allCurrenciesSet.add(item.currency.toUpperCase());
    });
    // Eğer hiç veri yoksa TRY ekle
    if (allCurrenciesSet.size === 0) allCurrenciesSet.add('TRY');
    // Sıralı ve standart para birimi listesi
    const currencyOrder = ['TRY', 'USD', 'EUR', 'GBP'];
    const allCurrencies = Array.from(allCurrenciesSet).sort((a, b) => {
      const ia = currencyOrder.indexOf(a);
      const ib = currencyOrder.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    return (
      <div className="space-y-8">
        <h2 className="text-xl font-bold">Tüm Para Birimleri Finansal Özeti</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2">
          {allCurrencies.map((cur) => {
            const summary = getFinancialSummaryByCurrency(cur);
            const currencySymbol = cur === "TRY" ? "₺" : cur === "USD" ? "$" : cur === "EUR" ? "€" : cur === "GBP" ? "£" : cur;
            return (
              <Card key={cur} className="overflow-hidden">
                <CardHeader className="p-2 pb-0">
                  <CardTitle className="text-sm font-medium">{cur} Özeti</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(summary.totalIncome, cur)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Finansal: {formatCurrency(summary.income, cur)} | Tur: {formatCurrency(summary.tourIncome, cur)}
                  </div>
                  <div className="text-xs text-red-600">Gider: {formatCurrency(summary.expense, cur)}</div>
                  <div className={`text-xs ${summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>Net Kar/Zarar: {formatCurrency(summary.totalProfit, cur)}</div>
                  <div className={`text-xs ${summary.balance >= 0 ? "text-blue-600" : "text-red-600"}`}>Kasa: {formatCurrency(summary.balance, cur)}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border mt-8">
          <h3 className="font-medium mb-2">Detaylı Bilgi</h3>
          {allCurrencies.map((cur) => {
            const summary = getFinancialSummaryByCurrency(cur);
            return (
              <div key={cur} className="mb-6">
                <div className="font-bold mb-1">{cur} Detayı</div>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b bg-green-50"><td className="py-2">Finansal Gelirler</td><td className="py-2 text-right">{formatCurrency(summary.income, cur)}</td></tr>
                    <tr className="border-b bg-green-50"><td className="py-2">Tur Gelirleri</td><td className="py-2 text-right">{formatCurrency(summary.tourIncome, cur)}</td></tr>
                    <tr className="border-b bg-green-50"><td className="py-2">Toplam Gelir</td><td className="py-2 text-right font-medium">{formatCurrency(summary.totalIncome, cur)}</td></tr>
                    <tr className="border-b bg-red-50"><td className="py-2">Tur Giderleri</td><td className="py-2 text-right text-red-600">{formatCurrency(summary.tourExpenses, cur)}</td></tr>
                    <tr className="border-b bg-red-50"><td className="py-2">Diğer Giderler</td><td className="py-2 text-right text-red-600">{formatCurrency(summary.expense - summary.tourExpenses, cur)}</td></tr>
                    <tr className="border-b bg-red-50"><td className="py-2">Toplam Gider</td><td className="py-2 text-right text-red-600">{formatCurrency(summary.expense, cur)}</td></tr>
                    <tr className={`${summary.totalProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}><td className="py-2 font-medium">Net Kar/Zarar</td><td className={`py-2 text-right font-medium ${summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(summary.totalProfit, cur)}</td></tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const summary = getFinancialSummaryByCurrency(currency);
  const currencySymbol = currency === "all" ? "" : 
    currency === "TRY" ? "₺" : 
    currency === "USD" ? "$" : 
    currency === "EUR" ? "€" : 
    currency === "GBP" ? "£" : currency;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{currency} Para Birimi Finansal Özeti</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2">
        <Card className="overflow-hidden">
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(summary.totalIncome, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Finansal: {formatCurrency(summary.income, currency)} | 
              Tur: {formatCurrency(summary.tourIncome, currency)}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="text-xl font-bold text-red-600">
              {formatCurrency(summary.expense, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-sm font-medium">Net Kar/Zarar</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className={`text-xl font-bold ${summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(summary.totalProfit, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-sm font-medium">Kasa Bakiyesi</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className={`text-xl font-bold ${summary.balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {formatCurrency(summary.balance, currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-medium mb-2">Detaylı Bilgi</h3>
        <table className="w-full">
          <tbody>
            <tr className="border-b bg-green-50">
              <td className="py-2">Finansal Gelirler</td>
              <td className="py-2 text-right">{formatCurrency(summary.income, currency)}</td>
            </tr>
            <tr className="border-b bg-green-50">
              <td className="py-2">Tur Gelirleri</td>
              <td className="py-2 text-right">{formatCurrency(summary.tourIncome, currency)}</td>
            </tr>
            <tr className="border-b bg-green-50">
              <td className="py-2">Toplam Gelir</td>
              <td className="py-2 text-right font-medium">{formatCurrency(summary.totalIncome, currency)}</td>
            </tr>
            <tr className="border-b bg-red-50">
              <td className="py-2">Tur Giderleri</td>
              <td className="py-2 text-right text-red-600">{formatCurrency(summary.tourExpenses, currency)}</td>
            </tr>
            <tr className="border-b bg-red-50">
              <td className="py-2">Diğer Giderler</td>
              <td className="py-2 text-right text-red-600">{formatCurrency(summary.expense - summary.tourExpenses, currency)}</td>
            </tr>
            <tr className="border-b bg-red-50">
              <td className="py-2">Toplam Gider</td>
              <td className="py-2 text-right text-red-600">{formatCurrency(summary.expense, currency)}</td>
            </tr>
            <tr className={`${summary.totalProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <td className="py-2 font-medium">Net Kar/Zarar</td>
              <td className={`py-2 text-right font-medium ${summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(summary.totalProfit, currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
