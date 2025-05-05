"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Download, Upload, Calendar, AlertTriangle } from "lucide-react"
import { exportData, importData } from "@/lib/export-import"

export function BackupRestoreView({ onClose }) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [backupName, setBackupName] = useState(`Yedek_${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}`)
  const [backupOptions, setBackupOptions] = useState({
    financial: true,
    tours: true,
    customers: true,
    settings: true
  })

  const handleBackup = async () => {
    try {
      setIsExporting(true)
      const success = await exportData()
      if (success) {
        toast({
          title: "Yedekleme başarılı",
          description: "Verileriniz başarıyla bilgisayarınıza kaydedildi.",
        })
      }
    } catch (error) {
      console.error("Yedekleme hatası:", error)
      toast({
        title: "Yedekleme hatası",
        description: "Verileriniz yedeklenirken bir hata oluştu.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleRestore = async () => {
    try {
      setIsImporting(true)
      await importData()
      toast({
        title: "Geri yükleme başarılı",
        description: "Verileriniz başarıyla geri yüklendi. Değişikliklerin görünmesi için sayfa yenilenecek.",
      })
      
      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("Geri yükleme hatası:", error)
      toast({
        title: "Geri yükleme hatası",
        description: error.message || "Verileriniz geri yüklenirken bir hata oluştu.",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Yedekleme ve Geri Yükleme</CardTitle>
        <Button variant="outline" onClick={onClose}>
          Kapat
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="backup">
          <TabsList className="mb-4">
            <TabsTrigger value="backup">Yedekleme</TabsTrigger>
            <TabsTrigger value="restore">Geri Yükleme</TabsTrigger>
            <TabsTrigger value="schedule">Zamanlama</TabsTrigger>
          </TabsList>

          <TabsContent value="backup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backupName">Yedek Adı</Label>
              <Input
                id="backupName"
                placeholder="Yedek adını girin"
                defaultValue={`Yedek_${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}`}
              />
            </div>

            <div className="space-y-2">
              <Label>Yedeklenecek Veriler</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="backupFinancial" defaultChecked />
                  <Label htmlFor="backupFinancial">Finansal Veriler</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="backupTours" defaultChecked />
                  <Label htmlFor="backupTours">Tur Verileri</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="backupSettings" defaultChecked />
                  <Label htmlFor="backupSettings">Ayarlar</Label>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={handleBackup}>
              <Download className="mr-2 h-4 w-4" />
              Yedekle
            </Button>
          </TabsContent>

          <TabsContent value="restore" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restoreFile">Yedek Dosyası</Label>
              <div className="flex items-center gap-2">
                <Input id="restoreFile" type="file" accept=".json" />
              </div>
            </div>

            <div className="rounded-md border p-4 bg-yellow-50">
              <p className="text-sm text-yellow-800">
                <strong>Uyarı:</strong> Geri yükleme işlemi mevcut verilerin üzerine yazacaktır. Bu işlem geri alınamaz.
              </p>
            </div>

            <Button className="w-full" onClick={handleRestore}>
              <Upload className="mr-2 h-4 w-4" />
              Geri Yükle
            </Button>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleFrequency">Yedekleme Sıklığı</Label>
              <select
                id="scheduleFrequency"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue="daily"
              >
                <option value="hourly">Saatlik</option>
                <option value="daily">Günlük</option>
                <option value="weekly">Haftalık</option>
                <option value="monthly">Aylık</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleTime">Yedekleme Zamanı</Label>
              <Input id="scheduleTime" type="time" defaultValue="03:00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retentionPeriod">Saklama Süresi</Label>
              <select
                id="retentionPeriod"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue="30"
              >
                <option value="7">7 gün</option>
                <option value="14">14 gün</option>
                <option value="30">30 gün</option>
                <option value="90">90 gün</option>
                <option value="180">180 gün</option>
                <option value="365">365 gün</option>
              </select>
            </div>

            <Button className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Zamanlamayı Kaydet
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

