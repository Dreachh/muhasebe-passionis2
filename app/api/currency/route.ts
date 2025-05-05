import { NextResponse } from "next/server";
import fetch from "node-fetch";

export async function GET() {
  try {
    // open.er-api.com üzerinden TRY bazlı kurlar çekiliyor
    const res = await fetch("https://open.er-api.com/v6/latest/TRY");
    if (!res.ok) throw new Error("open.er-api.com'dan veri alınamadı");
    const data = await res.json();
    if (!data.rates) throw new Error("Kur verisi alınamadı");

    // İlgili kurları TRY bazlı olarak al
    const usd = data.rates.USD ? 1 / data.rates.USD : null;
    const eur = data.rates.EUR ? 1 / data.rates.EUR : null;
    const gbp = data.rates.GBP ? 1 / data.rates.GBP : null;
    const sar = data.rates.SAR ? 1 / data.rates.SAR : null;

    if (!usd || !eur || !gbp || !sar) throw new Error("Bazı kurlar eksik");

    const rates = [
      { code: "TRY", name: "Türk Lirası", buying: 1, selling: 1 },
      { code: "USD", name: "Amerikan Doları", buying: Number(usd.toFixed(4)), selling: Number((usd * 1.02).toFixed(4)) },
      { code: "EUR", name: "Euro", buying: Number(eur.toFixed(4)), selling: Number((eur * 1.02).toFixed(4)) },
      { code: "GBP", name: "İngiliz Sterlini", buying: Number(gbp.toFixed(4)), selling: Number((gbp * 1.02).toFixed(4)) },
      { code: "SAR", name: "Suudi Arabistan Riyali", buying: Number(sar.toFixed(4)), selling: Number((sar * 1.02).toFixed(4)) },
    ];
    return NextResponse.json({ rates, lastUpdated: new Date().toISOString() });
  } catch (error) {
    console.error("Döviz API Hatası:", error);
    return NextResponse.json({ error: `Canlı döviz kurları alınamadı. Hata: ${error?.message || error}` }, { status: 500 });
  }
}
