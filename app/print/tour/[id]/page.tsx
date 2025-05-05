"use client"

import { useEffect, useState, useRef } from "react"
import { TourPrintView } from "@/components/tour-print-view"
import { getSettings } from "@/lib/db"

export default function PrintTourPage({ params }) {
  const [tourData, setTourData] = useState(null)
  const [companyInfo, setCompanyInfo] = useState({
    name: "PassionisTravel",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo: null,
    footerText: "Bu belge PassionisTravel tarafından düzenlenmiştir."
  })
  const [isLoading, setIsLoading] = useState(true)
  const printAttempted = useRef(false)

  // Verileri yükleme işlemi
  useEffect(() => {
    // LocalStorage'dan tur verilerini al
    const loadTourData = () => {
      try {
        const printData = localStorage.getItem('printTourData');
        console.log('LocalStorage dan alınan veri:', printData);

        if (printData) {
          const parsedData = JSON.parse(printData);
          console.log('Ayrıştırılan veri:', parsedData);

          // Doğrudan parsedData'yı kullan, tour alt nesnesi arama
          setTourData(parsedData);
          setIsLoading(false);
        } else {
          console.error("Yazdırma verisi bulunamadı");
          alert("Yazdırma verisi bulunamadı. Lütfen tekrar deneyin.");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Yazdırma verileri ayrıştırılırken hata:", error);
        alert("Yazdırma verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
        setIsLoading(false);
      }
    }

    // Şirket bilgilerini yükle
    const loadSettings = async () => {
      try {
        const settings = await getSettings()
        if (settings?.companyInfo) {
          setCompanyInfo(prev => ({
            ...prev,
            ...settings.companyInfo
          }))
        }
      } catch (error) {
        console.error("Ayarlar yüklenirken hata:", error)
      }
    }
    
    // Verileri yükle - sadece bir kez çalışır
    loadTourData()
    loadSettings()
  }, [])

  // Yazdırma işlemi için ayrı bir useEffect
  useEffect(() => {
    // Sadece veriler yüklendiğinde ve daha önce yazdırma denemesi yapılmadıysa çalışır
    if (!isLoading && tourData && !printAttempted.current) {
      printAttempted.current = true // Sadece bir kez yazdırma denemesi yap
      
      const timer = setTimeout(() => {
        window.print()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isLoading, tourData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Yazdırma Verisi Yükleniyor...</h1>
          <p>Lütfen bekleyin...</p>
        </div>
      </div>
    )
  }
  
  if (!tourData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Yazdırma Verisi Bulunamadı</h1>
          <p>Lütfen ana sayfaya dönün ve tekrar deneyin.</p>
          <button 
            onClick={() => window.close()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Pencereyi Kapat
          </button>
        </div>
      </div>
    )
  }

  return <TourPrintView tour={tourData} companyInfo={companyInfo} />
}
