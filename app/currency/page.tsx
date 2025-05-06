"use client";
import React, { useEffect, useState } from "react";

// Döviz kuru servis fonksiyonunu kullanıyoruz
import { fetchExchangeRates } from "../../lib/currency-service";

// Kullanılacak para birimleri
const CURRENCIES = ["TRY", "USD", "EUR", "GBP", "SAR"];

export default function CurrencyPage() {
  // Döviz oranları, son güncelleme zamanı, yükleniyor mu, hata var mı gibi durumlar
  const [rates, setRates] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("TRY");
  const [amount, setAmount] = useState(1);
  const [result, setResult] = useState(0);
  // Alış/Satış kuru seçimi
  const [rateType, setRateType] = useState("buying"); // "buying" veya "selling"

  // Otomatik güncelleme: 10 dakikada bir
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const getRates = async () => {
      setLoading(true);
      setError("");
      try {
        // Merkezi servis fonksiyonu ile döviz kurlarını çek
        const data = await fetchExchangeRates();
        setRates(data.rates);
        setLastUpdate(new Date().toLocaleString());
      } catch (err: any) {
        setError(err.message || "Bilinmeyen hata");
      }
      setLoading(false);
    };
    getRates();
    interval = setInterval(getRates, 10 * 60 * 1000); // 10 dakika
    return () => clearInterval(interval);
  }, []);

  // Manuel güncelleme butonu
  const handleRefresh = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchExchangeRates();
      setRates(data.rates);
      setLastUpdate(new Date().toLocaleString());
    } catch (err: any) {
      setError(err.message || "Bilinmeyen hata");
    }
    setLoading(false);
  };

  // Manuel hesaplama
  const calculateConversion = () => {
    if (!rates || rates.length === 0) {
      setResult(0);
      return;
    }

    // Aynı para birimi için doğrudan geri dön
    if (from === to) {
      setResult(amount);
      return;
    }

    try {
      // TRY para birimi için özel durum
      if (from === "TRY") {
        const toCurrency = rates.find((r) => r.code === to);
        if (toCurrency) {
          // TRY -> diğer para birimi
          const rate = rateType === "buying" ? 
            Number(toCurrency.buying) : 
            Number(toCurrency.selling);
          
          // TRY'den diğer para birimine çevirirken
          // TRY değerini kura bölüyoruz
          const calculatedResult = amount / rate;
          setResult(Math.floor(calculatedResult * 100) / 100);
          return;
        }
      } else if (to === "TRY") {
        const fromCurrency = rates.find((r) => r.code === from);
        if (fromCurrency) {
          // diğer para birimi -> TRY
          const rate = rateType === "buying" ? 
            Number(fromCurrency.buying) : 
            Number(fromCurrency.selling);
          
          // Diğer para biriminden TRY'ye çevirirken
          // değeri kur ile çarpıyoruz
          const calculatedResult = amount * rate;
          setResult(Math.floor(calculatedResult * 100) / 100);
          return;
        }
      } else {
        // diğer para birimi -> diğer para birimi
        const fromCurrency = rates.find((r) => r.code === from);
        const toCurrency = rates.find((r) => r.code === to);
        
        if (fromCurrency && toCurrency) {
          // Seçilen kur tipine göre değerleri kullan
          const fromRate = rateType === "buying" ? 
            Number(fromCurrency.buying) : 
            Number(fromCurrency.selling);
          
          const toRate = rateType === "buying" ? 
            Number(toCurrency.buying) : 
            Number(toCurrency.selling);
            
          // Önce TRY'ye çevir, sonra hedef para birimine çevir
          const tryValue = amount * fromRate;
          const calculatedResult = tryValue / toRate;
          setResult(Math.floor(calculatedResult * 100) / 100);
          return;
        }
      }
      
      // Eğer buraya kadar geldiyse, hesaplama yapılamadı
      setResult(0);
      
    } catch (error) {
      console.error("Kur çevirme hatası:", error);
      setResult(0);
    }
  };

  // Değerler değiştiğinde hesaplamayı yap
  useEffect(() => {
    calculateConversion();
  }, [from, to, amount, rates, rateType]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded mt-8">
      <h1 className="text-2xl font-bold mb-4">Güncel Döviz Kurları (TRY Bazlı)</h1>
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Yükleniyor..." : "Güncelle"}
        </button>
        <span className="text-sm text-gray-500">Son Güncelleme: {lastUpdate}</span>
      </div>
      {error && <div className="text-red-600 mb-2">Hata: {error}</div>}
      <table className="min-w-full bg-white border rounded">
        <thead>
          <tr>
            <th className="border px-4 py-2">Para Birimi</th>
            <th className="border px-4 py-2">Alış</th>
            <th className="border px-4 py-2">Satış</th>
          </tr>
        </thead>
        <tbody>
          {rates
            .filter((r: any) => CURRENCIES.includes(r.code))
            .map((r: any) => (
              <tr key={r.code}>
                <td className="border px-4 py-2">{r.code}</td>
                <td className="border px-4 py-2">{Number(r.buying).toFixed(2)}</td>
                <td className="border px-4 py-2">{Number(r.selling).toFixed(2)}</td>
              </tr>
            ))}
        </tbody>
      </table>
      
      <div className="border-t pt-4 mt-4">
        <h2 className="font-semibold mb-4">Kur Çeviri Alanı</h2>
        
        <div className="flex flex-col gap-4 mb-4">
          {/* Kur Tipi Seçimi */}
          <div className="flex items-center gap-4">
            <label className="font-medium">Kur Tipi:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1">
                <input 
                  type="radio" 
                  name="rateType" 
                  value="buying" 
                  checked={rateType === "buying"}
                  onChange={() => setRateType("buying")} 
                />
                Alış
              </label>
              <label className="flex items-center gap-1">
                <input 
                  type="radio" 
                  name="rateType" 
                  value="selling" 
                  checked={rateType === "selling"}
                  onChange={() => setRateType("selling")} 
                />
                Satış
              </label>
            </div>
          </div>
          
          {/* Çeviri Alanları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            {/* Kaynak Para Birimi */}
            <div>
              <label className="block mb-1">Kaynak:</label>
              <div className="flex">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="border rounded-l px-2 py-1 w-24"
                />
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="border rounded-r px-2 py-1"
                >
                  {CURRENCIES.map((c) => (
                    <option value={c} key={`from-${c}`}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Yön İşareti */}
            <div className="flex justify-center items-center">
              <span className="text-xl font-bold">→</span>
            </div>
            
            {/* Hedef Para Birimi */}
            <div>
              <label className="block mb-1">Hedef:</label>
              <div className="flex">
                <input
                  type="text"
                  value={result.toFixed(2)}
                  readOnly
                  className="border rounded-l px-2 py-1 w-24 bg-gray-50"
                />
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="border rounded-r px-2 py-1"
                >
                  {CURRENCIES.map((c) => (
                    <option value={c} key={`to-${c}`}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Hesaplama detayları */}
          <div className="text-base mt-2 font-medium">
            {amount} {from} = <span className="font-bold">{result.toFixed(2)}</span> {to} 
            <span className="text-gray-500 ml-2">({rateType === 'buying' ? 'Alış' : 'Satış'} kuru ile)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
