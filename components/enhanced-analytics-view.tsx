"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { BarChart2, DollarSign, Users, Calendar, Filter } from "lucide-react"
import { CurrencyFinancialSummary } from "@/components/analytics/currency-financial-summary"
import { CustomerAnalytics } from "@/components/analytics/customer-analytics"
import { TourDetailedAnalytics } from "@/components/analytics/tour-detailed-analytics"
import { PrintableReport } from "@/components/analytics/printable-report"
import { PrintButton } from "@/components/ui/print-button"
import { getDestinations } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"

export function EnhancedAnalyticsView({ financialData, toursData, customersData }) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("financial")
  const [selectedCurrency, setSelectedCurrency] = useState("all")
  const [destinations, setDestinations] = useState([])
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1),
    to: new Date()
  })
  
  // Destinasyonları yükle
  useEffect(() => {
    const loadDestinations = async () => {
      try {
        // Önce localStorage'dan yüklemeyi dene
        const cachedDestinations = localStorage.getItem('destinations')
        if (cachedDestinations) {
          const parsedDestinations = JSON.parse(cachedDestinations)
          if (Array.isArray(parsedDestinations) && parsedDestinations.length > 0) {
            setDestinations(parsedDestinations)
            return
          }
        }
        
        // Veritabanından destinasyonları yükle
        const destinationsData = await getDestinations()
        if (Array.isArray(destinationsData) && destinationsData.length > 0) {
          setDestinations(destinationsData)
          // Önbelleğe kaydet
          localStorage.setItem('destinations', JSON.stringify(destinationsData))
        } else {
          // Varsayılan destinasyonlar
          const defaultDestinations = [
            { id: "default-dest-1", name: "Antalya", country: "Türkiye" },
            { id: "default-dest-2", name: "İstanbul", country: "Türkiye" },
            { id: "default-dest-3", name: "Kapadokya", country: "Türkiye" }
          ]
          setDestinations(defaultDestinations)
        }
      } catch (error) {
        console.error("Destinasyonlar yüklenirken hata:", error)
        toast({
          title: "Hata",
          description: "Destinasyon verileri yüklenemedi.",
          variant: "destructive",
        })
      }
    }
    
    loadDestinations()
  }, [toast])

  // Tarih aralığına göre veri filtreleme
  const filterDataByDateRange = (data) => {
    if (!dateRange.from || !dateRange.to) return data
    return data.filter(item => {
      const itemDate = new Date(item?.date || item?.tourDate)
      return itemDate >= dateRange.from && itemDate <= dateRange.to
    })
  }

  const filteredFinancialData = filterDataByDateRange(financialData)
  const filteredToursData = filterDataByDateRange(toursData)
  const filteredCustomersData = filterDataByDateRange(customersData)

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-[#00a1c6] flex items-center">
            <BarChart2 className="h-5 w-5 mr-2" />
            Gelişmiş Analiz
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Para Birimi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Para Birimleri</SelectItem>
                  <SelectItem value="TRY">Türk Lirası (₺)</SelectItem>
                  <SelectItem value="USD">Amerikan Doları ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">İngiliz Sterlini (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="financial">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Finansal Analiz
                  </TabsTrigger>
                  <TabsTrigger value="customers">
                    <Users className="h-4 w-4 mr-2" />
                    Müşteri Analizi
                  </TabsTrigger>
                  <TabsTrigger value="tours">
                    <Calendar className="h-4 w-4 mr-2" />
                    Tur Analizi
                  </TabsTrigger>
                </TabsList>
                
                <PrintButton 
                  type="analytics"
                  data={{
                    financialData: filteredFinancialData,
                    toursData: filteredToursData,
                    customersData: filteredCustomersData
                  }}
                  dateRange={dateRange}
                  selectedCurrency={selectedCurrency}
                  companyInfo={JSON.parse(localStorage.getItem('companyInfo') || '{}')}
                  nationalityData={toursData.reduce((acc, tour) => {
                    const nationality = tour.customerNationality || 'Belirtilmemiş'
                    const existingItem = acc.find(item => item.name === nationality)
                    if (existingItem) {
                      existingItem.value++
                    } else {
                      acc.push({ name: nationality, value: 1 })
                    }
                    return acc
                  }, [])}
                  referralSourceData={toursData.reduce((acc, tour) => {
                    const source = tour.referralSource || 'Belirtilmemiş'
                    const existingItem = acc.find(item => item.name === source)
                    if (existingItem) {
                      existingItem.value++
                    } else {
                      acc.push({ name: source, value: 1 })
                    }
                    return acc
                  }, [])}
                  toursByDestination={destinations.map(dest => {
                    const toursForDest = filteredToursData.filter(tour => tour.destination === dest.name)
                    return {
                      name: dest.name,
                      count: toursForDest.length,
                      customers: toursForDest.reduce((sum, tour) => sum + 1, 0),
                      revenue: toursForDest.reduce((sum, tour) => sum + (Number(tour.totalPrice) || 0), 0)
                    }
                  }).sort((a, b) => b.count - a.count)}
                  toursByMonth={Array.from({ length: 12 }, (_, i) => {
                    const monthDate = new Date(new Date().getFullYear(), i, 1)
                    const monthName = monthDate.toLocaleString('tr-TR', { month: 'long' })
                    const toursInMonth = filteredToursData.filter(tour => {
                      const tourDate = new Date(tour.tourDate)
                      return tourDate.getMonth() === i
                    })
                    return {
                      name: monthName,
                      tours: toursInMonth.length,
                      customers: toursInMonth.reduce((sum, tour) => sum + 1, 0),
                      revenue: toursInMonth.reduce((sum, tour) => sum + (Number(tour.totalPrice) || 0), 0)
                    }
                  })}
                  currencySummaries={['TRY', 'USD', 'EUR', 'GBP'].reduce((acc, curr) => {
                    // Gelirler
                    const incomeRecords = filteredFinancialData.filter(item => item.type === 'income' && item.currency === curr)
                    const totalIncome = incomeRecords.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
                    
                    // Giderler
                    const expenseRecords = filteredFinancialData.filter(item => item.type === 'expense' && item.currency === curr)
                    const totalExpense = expenseRecords.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
                    
                    // Tur gelirleri
                    const tourIncome = filteredToursData
                      .filter(tour => tour.currency === curr)
                      .reduce((sum, tour) => sum + (Number(tour.totalPrice) || 0), 0)
                    
                    acc[curr] = {
                      totalIncome: totalIncome + tourIncome,
                      expense: totalExpense,
                      totalProfit: totalIncome + tourIncome - totalExpense,
                      balance: totalIncome + tourIncome - totalExpense
                    }
                    return acc
                  }, {})}
                  
                />
              </div>

              <TabsContent value="financial">
                <CurrencyFinancialSummary 
                  financialData={filteredFinancialData}
                  toursData={filteredToursData}
                  currency={selectedCurrency}
                />
              </TabsContent>

              <TabsContent value="customers">
                <CustomerAnalytics 
                  toursData={filteredToursData}
                />
              </TabsContent>

              <TabsContent value="tours">
                <TourDetailedAnalytics 
                  toursData={filteredToursData}
                  selectedCurrency={selectedCurrency}
                  destinations={destinations}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Yazdırılabilir rapor bileşeni */}
        <div className="hidden">
          <PrintableReport
            financialData={filteredFinancialData}
            toursData={filteredToursData}
            customersData={filteredCustomersData}
            selectedCurrency={selectedCurrency}
            dateRange={dateRange}
          />
        </div>
      </CardContent>
      </Card>
  )
}