"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { exportData, importData } from "@/lib/export-import";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Check, Database, Server } from "lucide-react";
import { exportAndDownload } from "@/lib/export-import";
import { migrateToFirestore } from "@/lib/db-firebase";
import { useToast } from "@/components/ui/use-toast";

export interface BackupRestoreProps {
  onComplete?: () => void;
}

export function BackupRestore({ onComplete }: BackupRestoreProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [migrationStatus, setMigrationStatus] = useState("");

  // LocalStorage yedekleme işlemi (mevcut yöntem)
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportStatus("Veriler dışa aktarılıyor...");
      await exportData();
      setExportStatus("Veriler başarıyla dışa aktarıldı!");
      toast({
        title: "Başarılı",
        description: "Veriler başarıyla dışa aktarıldı.",
      });
    } catch (error) {
      console.error("Dışa aktarma hatası:", error);
      setExportStatus("Dışa aktarma sırasında bir hata oluştu!");
      toast({
        title: "Hata",
        description: "Dışa aktarma sırasında bir hata oluştu!",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // LocalStorage içe aktarma işlemi (mevcut yöntem)
  const handleImport = async () => {
    try {
      setIsImporting(true);
      setImportStatus("Veriler içe aktarılıyor...");
      await importData();
      setImportStatus("Veriler başarıyla içe aktarıldı!");
      toast({
        title: "Başarılı",
        description: "Veriler başarıyla içe aktarıldı.",
      });
      if (onComplete) onComplete();
    } catch (error) {
      console.error("İçe aktarma hatası:", error);
      setImportStatus("İçe aktarma sırasında bir hata oluştu!");
      toast({
        title: "Hata",
        description: "İçe aktarma sırasında bir hata oluştu!",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // IndexedDB veri dışa aktarma (Firebase geçişi için)
  const handleExportIndexedDB = async () => {
    try {
      setIsExporting(true);
      setExportStatus("IndexedDB verileri dışa aktarılıyor...");
      await exportAndDownload();
      setExportStatus("IndexedDB verileri başarıyla dışa aktarıldı!");
      toast({
        title: "Başarılı",
        description: "IndexedDB verileri başarıyla dışa aktarıldı.",
      });
    } catch (error) {
      console.error("IndexedDB dışa aktarma hatası:", error);
      setExportStatus("IndexedDB dışa aktarma sırasında bir hata oluştu!");
      toast({
        title: "Hata",
        description: "IndexedDB dışa aktarma sırasında bir hata oluştu!",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Firebase'e veri göç işlemi
  const handleMigrateToFirebase = async () => {
    // Dosya seçme diyaloğu aç
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    
    input.onchange = async (e: any) => {
      try {
        const file = e.target.files[0];
        if (!file) {
          toast({
            title: "Hata",
            description: "Lütfen bir JSON dosyası seçin.",
            variant: "destructive",
          });
          return;
        }

        setIsMigrating(true);
        setMigrationStatus("Dosya yükleniyor...");

        // Dosyayı oku
        const reader = new FileReader();
        reader.onload = async (event: any) => {
          try {
            const data = JSON.parse(event.target.result);
            setMigrationStatus("Veriler Firebase'e aktarılıyor...");
            
            // Firestore'a veri göç işlemini başlat
            await migrateToFirestore(data);
            
            setMigrationStatus("Veriler başarıyla Firebase'e aktarıldı!");
            toast({
              title: "Başarılı",
              description: "Veriler başarıyla Firebase'e aktarıldı.",
            });
            
            if (onComplete) onComplete();
          } catch (error) {
            console.error("Veri aktarma hatası:", error);
            setMigrationStatus("Veri aktarma sırasında bir hata oluştu!");
            toast({
              title: "Hata",
              description: "Veri aktarma sırasında bir hata oluştu!",
              variant: "destructive",
            });
          } finally {
            setIsMigrating(false);
          }
        };

        reader.onerror = () => {
          setMigrationStatus("Dosya okuma hatası!");
          setIsMigrating(false);
          toast({
            title: "Hata",
            description: "Dosya okuma sırasında bir hata oluştu!",
            variant: "destructive",
          });
        };

        reader.readAsText(file);
      } catch (error) {
        console.error("Dosya işleme hatası:", error);
        setMigrationStatus("Dosya işleme sırasında bir hata oluştu!");
        setIsMigrating(false);
        toast({
          title: "Hata",
          description: "Dosya işleme sırasında bir hata oluştu!",
          variant: "destructive",
        });
      }
    };

    input.click();
  };

  return (
    <Card className="w-[600px] max-w-full">
      <CardHeader>
        <CardTitle>Veri Yedekleme ve Taşıma</CardTitle>
        <CardDescription>
          Verilerinizi yedekleyin, geri yükleyin veya Firebase'e taşıyın.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="backup">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backup">Yedekleme</TabsTrigger>
            <TabsTrigger value="restore">Geri Yükleme</TabsTrigger>
            <TabsTrigger value="migrate">Firebase'e Geçiş</TabsTrigger>
          </TabsList>
          
          <TabsContent value="backup" className="space-y-4 mt-4">
            <div className="flex flex-col space-y-4">
              <p className="text-sm text-muted-foreground">
                Mevcut verilerinizin bir yedeğini alın. Yedek dosyası daha sonra geri yüklenebilir.
              </p>
              
              <Button 
                onClick={handleExport} 
                disabled={isExporting} 
                className="w-full"
              >
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                {isExporting ? "Yedekleniyor..." : "Yedekle"}
              </Button>
              
              {exportStatus && (
                <Alert className={exportStatus.includes("hata") ? "bg-red-50" : "bg-green-50"}>
                  {exportStatus.includes("hata") ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <AlertTitle>Durum</AlertTitle>
                  <AlertDescription>{exportStatus}</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="restore" className="space-y-4 mt-4">
            <div className="flex flex-col space-y-4">
              <p className="text-sm text-muted-foreground">
                Önceden aldığınız bir yedeği sisteme geri yükleyin. Mevcut verileriniz üzerine yazılacaktır.
              </p>
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-600">Dikkat</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Bu işlem mevcut verilerinizin üzerine yazacaktır. İşlem geri alınamaz.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleImport} 
                disabled={isImporting} 
                className="w-full"
                variant="outline"
              >
                <ArrowUpFromLine className="mr-2 h-4 w-4" />
                {isImporting ? "İçe Aktarılıyor..." : "Yedek Dosyasını Yükle"}
              </Button>
              
              {importStatus && (
                <Alert className={importStatus.includes("hata") ? "bg-red-50" : "bg-green-50"}>
                  {importStatus.includes("hata") ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <AlertTitle>Durum</AlertTitle>
                  <AlertDescription>{importStatus}</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="migrate" className="space-y-4 mt-4">
            <div className="flex flex-col space-y-4">
              <p className="text-sm text-muted-foreground">
                Verilerinizi IndexedDB'den Firebase'e taşıyın. Bu işlem, uygulamanın veritabanı altyapısını değiştirir.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">1. IndexedDB'den Ver Dışa Aktar</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-muted-foreground mb-4">
                      Bu adımda tüm IndexedDB verileriniz bir JSON dosyasına aktarılır.
                    </p>
                    <Button 
                      onClick={handleExportIndexedDB} 
                      disabled={isExporting} 
                      size="sm"
                      className="w-full"
                      variant="outline"
                    >
                      <Database className="mr-2 h-4 w-4" />
                      {isExporting ? "Dışa Aktarılıyor..." : "IndexedDB'den Dışa Aktar"}
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">2. Firebase'e Aktar</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-muted-foreground mb-4">
                      Bu adımda dışa aktarılan veriler Firebase'e taşınır.
                    </p>
                    <Button 
                      onClick={handleMigrateToFirebase} 
                      disabled={isMigrating} 
                      size="sm"
                      className="w-full"
                    >
                      <Server className="mr-2 h-4 w-4" />
                      {isMigrating ? "Aktarılıyor..." : "Firebase'e Aktar"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              {(exportStatus || migrationStatus) && (
                <Alert className={
                  (exportStatus.includes("hata") || migrationStatus.includes("hata")) 
                    ? "bg-red-50" 
                    : "bg-green-50"
                }>
                  {(exportStatus.includes("hata") || migrationStatus.includes("hata")) ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <AlertTitle>Durum</AlertTitle>
                  <AlertDescription>
                    {exportStatus && <p>{exportStatus}</p>}
                    {migrationStatus && <p>{migrationStatus}</p>}
                  </AlertDescription>
                </Alert>
              )}
              
              <Alert className="bg-blue-50 border-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-600">Firebase Yapılandırması</AlertTitle>
                <AlertDescription className="text-blue-700">
                  <p className="mb-2">Firebase'e geçiş yapmadan önce:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Firebase projenizi oluşturun</li>
                    <li>.env.local dosyasına Firebase yapılandırma değerlerinizi ekleyin</li>
                    <li>Firebase'de Firestore veritabanını oluşturun</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onComplete}>
          İptal
        </Button>
      </CardFooter>
    </Card>
  );
}

// Ana sayfa için BackupRestoreView bileşeni
export function BackupRestoreView({ onClose, onExport, onImport }: {
  onClose: () => void;
  onExport: () => void;
  onImport: () => void;
}) {
  const { toast } = useToast();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Veri Yedekleme ve Geri Yükleme</h2>
        <Button variant="outline" onClick={onClose}>Kapat</Button>
      </div>
      
      <BackupRestore onComplete={onClose} />
    </div>
  );
}

