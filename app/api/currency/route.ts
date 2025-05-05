import { NextResponse } from "next/server";
import fetch from "node-fetch";

export async function GET() {
  try {
    const apiBase = "https://api.exchangerate.host/latest";
    const fetchRate = async (base) => {
      const res = await fetch(`${apiBase}?base=${base}&symbols=TRY`);
      if (!res.ok) throw new Error(`API response not ok for base ${base}`);
      const data = await res.json();
      if (!data.rates || !data.rates.TRY) throw new Error(`No TRY rate in response for base ${base}`);
      // API'den dönen oranı logla
      console.log(`API ${base}/TRY oranı:`, data.rates.TRY);
      // Eğer oran 1'in altındaysa ters çevir (ör: 0.03 ise 1/0.03 = 33.33)
      const rate = data.rates.TRY < 1 ? 1 / data.rates.TRY : data.rates.TRY;
      return Number(rate.toFixed(4));
    };
    const [usd, eur, gbp, sar] = await Promise.all([
      fetchRate("USD"),
      fetchRate("EUR"),
      fetchRate("GBP"),
      fetchRate("SAR"),
    ]);
    const rates = [
      { code: "TRY", name: "Türk Lirası", buying: 1, selling: 1 },
      { code: "USD", name: "Amerikan Doları", buying: usd, selling: Number((usd * 1.02).toFixed(2)) },
      { code: "EUR", name: "Euro", buying: eur, selling: Number((eur * 1.02).toFixed(2)) },
      { code: "GBP", name: "İngiliz Sterlini", buying: gbp, selling: Number((gbp * 1.02).toFixed(2)) },
      { code: "SAR", name: "Suudi Arabistan Riyali", buying: sar, selling: Number((sar * 1.02).toFixed(2)) },
    ];
    return NextResponse.json({ rates, lastUpdated: new Date().toISOString() });
  } catch (error) {
    console.error("Döviz API Hatası:", error);
    return NextResponse.json({ error: `Canlı döviz kurları alınamadı, sabit kurlar gösteriliyor. Hata: ${error?.message || error}` }, { status: 500 });
  }
}
