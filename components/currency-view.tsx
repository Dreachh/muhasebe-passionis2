"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function CurrencyView({ onClose }) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Gerçekçi döviz kurları
  const [rates, setRates] = useState([
    { code: "USD", name: "Amerikan Doları", buying: 32.85, selling: 33.05 },
    { code: "EUR", name: "Euro", buying: 35.6, selling: 35.9 },
    { code: "GBP", name: "İngiliz Sterlini", buying: 41.75, selling: 42.15 },
    { code: "CHF", name: "İsviçre Frangı", buying: 36.4, selling: 36.7 },
    { code: "JPY", name: "Japon Yeni", buying: 0.22, selling: 0.23 },
    { code: "SAR", name: "Suudi Arabistan Riyali", buying: 8.75, selling: 8.85 },
    { code: "AUD", name: "Avustralya Doları", buying: 21.9, selling: 22.1 },
    { code: "CAD", name: "Kanada Doları", buying: 24.15, selling: 24.35 },
  ])

  const [amount, setAmount] = useState("1")
  const [fromCurrency, setFromCurrency] = useState("TRY")
  const [toCurrency, setToCurrency] = useState("USD")
  const [result, setResult] = useState("")

  const handleRefresh = () => {
    setIsLoading(true)

    // Gerçek API çağrısı simülasyonu
    setTimeout(() => {
      // Kurları güncel değerlerle güncelle
      const updatedRates = [
        {
          code: "USD",
          name: "Amerikan Doları",
          buying: 32.85 + (Math.random() * 0.3 - 0.15),
          selling: 33.05 + (Math.random() * 0.3 - 0.15),
        },
        {
          code: "EUR",
          name: "Euro",
          buying: 35.6 + (Math.random() * 0.3 - 0.15),
          selling: 35.9 + (Math.random() * 0.3 - 0.15),
        },
        {
          code: "GBP",
          name: "İngiliz Sterlini",
          buying: 41.75 + (Math.random() * 0.4 - 0.2),
          selling: 42.15 + (Math.random() * 0.4 - 0.2),
        },
        {
          code: "CHF",
          name: "İsviçre Frangı",
          buying: 36.4 + (Math.random() * 0.3 - 0.15),
          selling: 36.7 + (Math.random() * 0.3 - 0.15),
        },
        {
          code: "JPY",
          name: "Japon Yeni",
          buying: 0.22 + (Math.random() * 0.01 - 0.005),
          selling: 0.23 + (Math.random() * 0.01 - 0.005),
        },
        {
          code: "SAR",
          name: "Suudi Arabistan Riyali",
          buying: 8.75 + (Math.random() * 0.1 - 0.05),
          selling: 8.85 + (Math.random() * 0.1 - 0.05),
        },
        {
          code: "AUD",
          name: "Avustralya Doları",
          buying: 21.9 + (Math.random() * 0.2 - 0.1),
          selling: 22.1 + (Math.random() * 0.2 - 0.1),
        },
        {
          code: "CAD",
          name: "Kanada Doları",
          buying: 24.15 + (Math.random() * 0.2 - 0.1),
          selling: 24.35 + (Math.random() * 0.2 - 0.1),
        },
      ].map((rate) => ({
        ...rate,
        buying: Number.parseFloat(rate.buying.toFixed(2)),
        selling: Number.parseFloat(rate.selling.toFixed(2)),
      }))

      setRates(updatedRates)
      setLastUpdate(new Date())
      setIsLoading(false)

      toast({
        title: "Kurlar güncellendi",
        description: "Döviz kurları başarıyla güncellendi.",
      })
    }, 1500)
  }

  const handleConvert = () => {
    let convertedAmount = 0
    const amountValue = Number.parseFloat(amount)

    if (fromCurrency === "TRY" && toCurrency !== "TRY") {
      // TRY'den yabancı para birimine
      const currency = rates.find((r) => r.code === toCurrency)
      if (currency) {
        convertedAmount = amountValue / currency.selling
      }
    } else if (fromCurrency !== "TRY" && toCurrency === "TRY") {
      // Yabancı para biriminden TRY'ye
      const currency = rates.find((r) => r.code === fromCurrency)
      if (currency) {
        convertedAmount = amountValue * currency.buying
      }
    } else if (fromCurrency !== "TRY" && toCurrency !== "TRY") {
      // Yabancı para biriminden yabancı para birimine
      const fromRate = rates.find((r) => r.code === fromCurrency)
      const toRate = rates.find((r) => r.code === toCurrency)
      if (fromRate && toRate) {
        // Önce TRY'ye çevir, sonra hedef para birimine
        const tryAmount = amountValue * fromRate.buying
        convertedAmount = tryAmount / toRate.selling
      }
    } else {
      // TRY'den TRY'ye
      convertedAmount = amountValue
    }

    setResult(`${amountValue} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`)
  }

  useEffect(() => {
    // Sayfa yüklendiğinde kurları güncelle
    handleRefresh()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#00a1c6]">Döviz Kurları</CardTitle>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">Son güncelleme: {lastUpdate.toLocaleTimeString("tr-TR")}</div>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Güncelle
          </Button>
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Para Birimi</TableHead>
                <TableHead className="text-right">Alış</TableHead>
                <TableHead className="text-right">Satış</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => (
                <TableRow key={rate.code}>
                  <TableCell className="font-medium">{rate.code}</TableCell>
                  <TableCell>{rate.name}</TableCell>
                  <TableCell className="text-right">{rate.buying.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{rate.selling.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Döviz Çevirici</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Miktar</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromCurrency">Kaynak Para Birimi</Label>
                <select
                  id="fromCurrency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                >
                  <option value="TRY">Türk Lirası (TRY)</option>
                  {rates.map((rate) => (
                    <option key={rate.code} value={rate.code}>
                      {rate.name} ({rate.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toCurrency">Hedef Para Birimi</Label>
                <select
                  id="toCurrency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                >
                  <option value="TRY">Türk Lirası (TRY)</option>
                  {rates.map((rate) => (
                    <option key={rate.code} value={rate.code}>
                      {rate.name} ({rate.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleConvert} className="w-full bg-[#2b3275] hover:bg-[#00a1c6]">
                  Çevir
                </Button>
              </div>
            </div>

            {result && <div className="mt-4 p-4 bg-muted rounded-md text-center font-medium">{result}</div>}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

