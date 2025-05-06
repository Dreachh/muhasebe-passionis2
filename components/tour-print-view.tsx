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
        <h1 className="text-xl font-bold text-teal-600">Tur Bilgileri <span className="text-sm font-medium text-gray-500">(Tour Information)</span></h1>
      </div>

      <div className="mb-3">
        <h2 className="text-lg font-semibold border-b pb-1 mb-2">
          Tur Detayları <span className="text-xs font-medium text-gray-500">(Tour Details)</span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-gray-600 text-sm">Seri No: <span className="text-xs text-gray-500">(Ref No)</span></p>
            <p className="font-medium">{tour.serialNumber}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Tur Kaydını Oluşturan Kişi: <span className="text-xs text-gray-500">(Created By)</span></p>
            <p className="font-medium">{tour.tourName}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Başlangıç Tarihi: <span className="text-xs text-gray-500">(Start Date)</span></p>
            <p className="font-medium">{formatDate(tour.tourDate)}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Bitiş Tarihi: <span className="text-xs text-gray-500">(End Date)</span></p>
            <p className="font-medium">{tour.tourEndDate ? formatDate(tour.tourEndDate) : "-"}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Kişi Sayısı: <span className="text-xs text-gray-500">(Number of Participants)</span></p>
            <p className="font-medium">
              {tour.numberOfPeople} Yetişkin <span className="text-xs text-gray-500">(Adult)</span>, {tour.numberOfChildren} Çocuk <span className="text-xs text-gray-500">(Child)</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <h2 className="text-lg font-semibold border-b pb-1 mb-2">
          Müşteri Bilgileri <span className="text-xs font-medium text-gray-500">(Customer Information)</span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-gray-600 text-sm">Ad Soyad: <span className="text-xs text-gray-500">(Full Name)</span></p>
            <p className="font-medium">{tour.customerName}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Telefon: <span className="text-xs text-gray-500">(Phone)</span></p>
            <p className="font-medium">{tour.customerPhone}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">E-posta: <span className="text-xs text-gray-500">(Email)</span></p>
            <p className="font-medium">{tour.customerEmail}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">TC/Pasaport No: <span className="text-xs text-gray-500">(ID/Passport No)</span></p>
            <p className="font-medium">{tour.customerIdNumber}</p>
          </div>
        </div>

        {tour.additionalCustomers?.length > 0 && (
          <div className="mt-2">
            <h3 className="font-medium mb-1 text-sm">
              Ek Katılımcılar <span className="text-xs text-gray-500">(Additional Participants)</span>
            </h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1 text-left">Ad Soyad <span className="text-xs text-gray-500">(Name)</span></th>
                  <th className="border p-1 text-left">Telefon <span className="text-xs text-gray-500">(Phone)</span></th>
                  <th className="border p-1 text-left">TC/Pasaport No <span className="text-xs text-gray-500">(ID/Passport)</span></th>
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
          <h2 className="text-lg font-semibold border-b pb-1 mb-2">
            Aktiviteler <span className="text-xs font-medium text-gray-500">(Activities)</span>
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1 text-center">
                  <div>Aktivite</div>
                  <div className="text-xs text-gray-500">(Activity)</div>
                </th>
                <th className="border p-1 text-center">
                  <div>Tarih</div>
                  <div className="text-xs text-gray-500">(Date)</div>
                </th>
                <th className="border p-1 text-center">
                  <div>Süre</div>
                  <div className="text-xs text-gray-500">(Duration)</div>
                </th>
                <th className="border p-1 text-center">
                  <div>Katılımcı Sayısı</div>
                  <div className="text-xs text-gray-500">(Participants)</div>
                </th>
                <th className="border p-1 text-center">
                  <div>Kişi Başı Fiyat</div>
                  <div className="text-xs text-gray-500">(Price per Person)</div>
                </th>
                <th className="border p-1 text-center">
                  <div>Toplam Fiyat</div>
                  <div className="text-xs text-gray-500">(Total Price)</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {tour.activities.map((activity) => {
                const participants = Number(activity.participants) || 0;
                const price = Number(activity.price) || 0;
                const totalPrice = participants > 0 ? price * participants : price;
                
                return (
                  <tr key={activity.id}>
                    <td className="border p-1">{activity.name}</td>
                    <td className="border p-1">{activity.date ? formatDate(activity.date) : "-"}</td>
                    <td className="border p-1">{activity.duration}</td>
                    <td className="border p-1 text-center">{participants > 0 ? participants : "-"}</td>
                    <td className="border p-1 text-right">{formatCurrency(price, activity.currency)}</td>
                    <td className="border p-1 text-right">{formatCurrency(totalPrice, activity.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-3">
        <h2 className="text-lg font-semibold border-b pb-1 mb-2">
          Ödeme Bilgileri <span className="text-xs font-medium text-gray-500">(Payment Information)</span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-gray-600 text-sm">Kişi Başı Fiyat: <span className="text-xs text-gray-500">(Price Per Person)</span></p>
            <p className="font-medium">{formatCurrency(tour.pricePerPerson, tour.currency)}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Toplam Fiyat: <span className="text-xs text-gray-500">(Total Price)</span></p>
            <p className="font-bold">{formatCurrency(tour.totalPrice, tour.currency)}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Ödeme Durumu: <span className="text-xs text-gray-500">(Payment Status)</span></p>
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
              <span className="text-xs text-gray-500 ml-1">
                {tour.paymentStatus === "pending"
                  ? "(Pending)"
                  : tour.paymentStatus === "partial"
                    ? "(Partial Payment)"
                    : tour.paymentStatus === "completed"
                      ? "(Completed)"
                      : tour.paymentStatus === "refunded"
                        ? "(Refunded)"
                        : "(Unknown)"}
              </span>
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Ödeme Yöntemi: <span className="text-xs text-gray-500">(Payment Method)</span></p>
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
              <span className="text-xs text-gray-500 ml-1">
                {tour.paymentMethod === "cash"
                  ? "(Cash)"
                  : tour.paymentMethod === "creditCard"
                    ? "(Credit Card)"
                    : tour.paymentMethod === "bankTransfer"
                      ? "(Bank Transfer)"
                      : tour.paymentMethod === "other"
                        ? "(Other)"
                        : "(Unknown)"}
              </span>
            </p>
          </div>

          {tour.paymentStatus === "partial" && (
            <>
              <div>
                <p className="text-gray-600 text-sm">Yapılan Ödeme: <span className="text-xs text-gray-500">(Paid Amount)</span></p>
                <p className="font-medium">{formatCurrency(tour.partialPaymentAmount, tour.partialPaymentCurrency)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Kalan Ödeme: <span className="text-xs text-gray-500">(Remaining Amount)</span></p>
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

      <div className="mt-8 text-center text-xs text-gray-500 pt-2 border-t">
        {companyInfo.footerText || "Bu belge PassionisTravel tarafından düzenlenmiştir. / This document has been issued by PassionisTravel."}
      </div>
    </div>
  )
}

