// Kur Sayfası (Next.js 14 App Router için)
// Tüm işlevler ve açıklamalar Türkçe olarak eklenmiştir.

"use client";
import React, { useEffect, useState } from "react";

// Döviz kuru servis fonksiyonunu kullanıyoruz
import { fetchExchangeRates } from "../../lib/currency-service";
import { convertCurrency } from "../../lib/data-utils";

// Kullanılacak para birimleri
const CURRENCIES = ["TRY", "USD", "EUR", "GBP", "SAR"];

export default function CurrencyPage() {
  // Döviz oranları, son güncelleme zamanı, yükleniyor mu, hata var mı gibi durumlar
  const [rates, setRates] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [from, setFrom] = useState("TRY");
  const [to, setTo] = useState("USD");
  const [amount, setAmount] = useState(1);
  const [converted, setConverted] = useState(0);

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

  // Kur çevirme işlemi (merkezi servis fonksiyonu ile)
  useEffect(() => {
    if (from === to) {
      setConverted(Number(amount.toFixed(2)));
      return;
    }
    if (!rates || rates.length === 0) {
      setConverted(0);
      return;
    }
    setConverted(Number(convertCurrency(amount, from, to, rates).toFixed(2)));
  }, [amount, from, to, rates]);

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
        <h2 className="font-semibold mb-2">Kur Çeviri Alanı</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {CURRENCIES.map((c) => (
              <option value={c} key={c}>{c}</option>
            ))}
          </select>
          <span className="font-bold">→</span>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {CURRENCIES.map((c) => (
              <option value={c} key={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="border rounded px-2 py-1 w-28"
          />
        </div>
        <div className="text-lg">
          {amount} {from} = <span className="font-bold">{converted.toFixed(2)}</span> {to}
        </div>
      </div>
    </div>
  );
}
