"use client"

import { formatCurrency, formatDate } from "@/lib/data-utils"

export function TourPrintView({ tour, companyInfo = {
  name: "PassionisTravel",
  address: "",
  phone: "",
  email: "",
  website: "",
  logo: null,
  footerText: "Bu belge PassionisTravel tarafından düzenlenmiştir."
} }) {
  if (!tour) return null
  
  const currentDate = new Date()
  const formattedDate = formatDate(currentDate)

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white print:p-0">
      <div className="flex justify-between items-center mb-3">
        {/* Sol tarafta şirket logosu */}
        <div className="flex-shrink-0">
          {companyInfo.logo ? (
            <img 
              src={companyInfo.logo} 
              alt="Şirket Logosu" 
              className="h-16 object-contain" 
            />
          ) : (
            <h1 className="text-2xl font-bold text-teal-600">{companyInfo.name}</h1>
          )}
        </div>
        
        {/* Sağ tarafta tarih */}
        <div className="text-right">
          <p className="text-gray-600 text-sm">Tarih: {formattedDate}</p>
          <p className="text-gray-600 text-sm">Belge No: {tour.serialNumber}</p>
        </div>
      </div>
      
      <div className="text-center mb-3">
        <h1 className="text-xl font-bold text-teal-600">Tur Bilgileri</h1>
      </div>

      <div className="mb-3">
        <h2 className="text-lg font-semibold border-b pb-1 mb-2">Tur Detayları</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-gray-600 text-sm">Seri No:</p>
            <p className="font-medium">{tour.serialNumber}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Tur Kaydını Oluşturan Kişi:</p>
            <p className="font-medium">{tour.tourName}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Başlangıç Tarihi:</p>
            <p className="font-medium">{formatDate(tour.tourDate)}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Bitiş Tarihi:</p>
            <p className="font-medium">{tour.tourEndDate ? formatDate(tour.tourEndDate) : "-"}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Kişi Sayısı:</p>
            <p className="font-medium">
              {tour.numberOfPeople} Yetişkin, {tour.numberOfChildren} Çocuk
            </p>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <h2 className="text-lg font-semibold border-b pb-1 mb-2">Müşteri Bilgileri</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-gray-600 text-sm">Ad Soyad:</p>
            <p className="font-medium">{tour.customerName}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Telefon:</p>
            <p className="font-medium">{tour.customerPhone}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">E-posta:</p>
            <p className="font-medium">{tour.customerEmail}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">TC/Pasaport No:</p>
            <p className="font-medium">{tour.customerIdNumber}</p>
          </div>
        </div>

        {tour.additionalCustomers?.length > 0 && (
          <div className="mt-2">
            <h3 className="font-medium mb-1 text-sm">Ek Katılımcılar</h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1 text-left">Ad Soyad</th>
                  <th className="border p-1 text-left">Telefon</th>
                  <th className="border p-1 text-left">TC/Pasaport No</th>
                </tr>
              </thead>
              <tbody>
                {tour.additionalCustomers.map((customer, index) => (
                  <tr key={customer.id}>
                    <td className="border p-1">{customer.name}</td>
                    <td className="border p-1">{customer.phone}</td>
                    <td className="border p-1">{customer.idNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Aktiviteler - Müşteriye gösterilecek */}
      {tour.activities?.length > 0 && (
        <div className="mb-3">
          <h2 className="text-lg font-semibold border-b pb-1 mb-2">Aktiviteler</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1 text-left">Aktivite</th>
                <th className="border p-1 text-left">Tarih</th>
                <th className="border p-1 text-left">Süre</th>
                <th className="border p-1 text-right">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {tour.activities.map((activity) => (
                <tr key={activity.id}>
                  <td className="border p-1">{activity.name}</td>
                  <td className="border p-1">{activity.date ? formatDate(activity.date) : "-"}</td>
                  <td className="border p-1">{activity.duration}</td>
                  <td className="border p-1 text-right">{formatCurrency(activity.price, activity.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-3">
        <h2 className="text-lg font-semibold border-b pb-1 mb-2">Ödeme Bilgileri</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-gray-600 text-sm">Kişi Başı Fiyat:</p>
            <p className="font-medium">{formatCurrency(tour.pricePerPerson, tour.currency)}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Toplam Fiyat:</p>
            <p className="font-bold">{formatCurrency(tour.totalPrice, tour.currency)}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Ödeme Durumu:</p>
            <p className="font-medium">
              {tour.paymentStatus === "pending"
                ? "Beklemede"
                : tour.paymentStatus === "partial"
                  ? "Kısmi Ödeme"
                  : tour.paymentStatus === "completed"
                    ? "Tamamlandı"
                    : tour.paymentStatus === "refunded"
                      ? "İade Edildi"
                      : "Bilinmiyor"}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Ödeme Yöntemi:</p>
            <p className="font-medium">
              {tour.paymentMethod === "cash"
                ? "Nakit"
                : tour.paymentMethod === "creditCard"
                  ? "Kredi Kartı"
                  : tour.paymentMethod === "bankTransfer"
                    ? "Banka Transferi"
                    : tour.paymentMethod === "other"
                      ? "Diğer"
                      : "Bilinmiyor"}
            </p>
          </div>

          {tour.paymentStatus === "partial" && (
            <>
              <div>
                <p className="text-gray-600 text-sm">Yapılan Ödeme:</p>
                <p className="font-medium">{formatCurrency(tour.partialPaymentAmount, tour.partialPaymentCurrency)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Kalan Ödeme:</p>
                <p className="font-bold">
                  {formatCurrency(tour.totalPrice - tour.partialPaymentAmount, tour.currency)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {tour.notes && (
        <div className="mb-3">
          <h2 className="text-lg font-semibold border-b pb-1 mb-2">Notlar</h2>
          <p className="whitespace-pre-line text-sm">{tour.notes}</p>
        </div>
      )}

      <div className="mt-6 border-t pt-2 text-sm text-gray-500">
        <p className="text-center">{companyInfo.footerText || "Bu belge PassionisTravel tarafından düzenlenmiştir."}</p>
        <p className="text-center">
          {companyInfo.address && <span>{companyInfo.address} | </span>}
          {companyInfo.phone && <span>Tel: {companyInfo.phone} | </span>}
          {companyInfo.email && <span>E-posta: {companyInfo.email} | </span>}
          {companyInfo.website && <span>Web: {companyInfo.website}</span>}
        </p>
      </div>
    </div>
  )
}

