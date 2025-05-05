// Yerel depolamadan veri yükleme
export const loadSavedData = async () => {
  try {
    // Finansal verileri yükle
    const savedFinancialData = localStorage.getItem("financialData")
    const financialData = savedFinancialData ? JSON.parse(savedFinancialData) : []

    // Tur verilerini yükle
    const savedToursData = localStorage.getItem("toursData")
    const toursData = savedToursData ? JSON.parse(savedToursData) : []

    // Müşteri verilerini yükle
    const savedCustomerData = localStorage.getItem("customerData")
    const customerData = savedCustomerData ? JSON.parse(savedCustomerData) : []

    // Şirket bilgilerini yükle
    const savedCompanyInfo = localStorage.getItem("companyInfo")
    const companyInfo = savedCompanyInfo
      ? JSON.parse(savedCompanyInfo)
      : {
          name: "PassionisTravel",
          address: "Örnek Mahallesi, Örnek Caddesi No:123, İstanbul",
          phone: "+90 212 123 4567",
          email: "info@passionistour.com",
          taxId: "1234567890",
          website: "www.passionistour.com",
        }

    // Tercih ayarlarını yükle
    const savedPreferences = localStorage.getItem("preferences")
    const preferences = savedPreferences
      ? JSON.parse(savedPreferences)
      : {
          darkMode: false,
          notifications: true,
          autoBackup: true,
          language: "tr",
          defaultCurrency: "TRY",
          dateFormat: "DD.MM.YYYY",
          autoCalculateTax: true,
          taxRate: "18",
          showPricesWithTax: true,
          roundPrices: true,
        }

    return { financialData, toursData, customerData, companyInfo, preferences }
  } catch (error) {
    console.error("Veri yükleme hatası:", error)
    return { financialData: [], toursData: [], customerData: [], companyInfo: {}, preferences: {} }
  }
}

// Yerel depolamaya veri kaydetme
export const saveToLocalStorage = async (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error("Veri kaydetme hatası:", error)
    return false
  }
}

// Verileri temizleme
export const clearData = async () => {
  try {
    localStorage.removeItem("financialData")
    localStorage.removeItem("toursData")
    localStorage.removeItem("customerData")
    return true
  } catch (error) {
    console.error("Veri temizleme hatası:", error)
    return false
  }
}

// Para birimi formatı
export const formatCurrency = (amount, currency = "TRY") => {
  const currencySymbols = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£",
  }

  const symbol = currencySymbols[currency] || currency

  return `${symbol} ${Number.parseFloat(amount).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Tarih formatı
export const formatDate = (dateString, format = "DD.MM.YYYY") => {
  const date = new Date(dateString)

  if (format === "DD.MM.YYYY") {
    return date.toLocaleDateString("tr-TR")
  } else if (format === "MM/DD/YYYY") {
    return date.toLocaleDateString("en-US")
  } else if (format === "YYYY-MM-DD") {
    return date.toISOString().split("T")[0]
  }

  return date.toLocaleDateString("tr-TR")
}

// Döviz çevirme
export const convertCurrency = (amount, fromCurrency, toCurrency, rates) => {
  if (fromCurrency === toCurrency) {
    return amount
  }

  if (fromCurrency === "TRY" && toCurrency !== "TRY") {
    // TRY'den yabancı para birimine
    const currency = rates.find((r) => r.code === toCurrency)
    if (currency) {
      return amount / currency.selling
    }
    return amount
  }

  if (fromCurrency !== "TRY" && toCurrency === "TRY") {
    // Yabancı para biriminden TRY'ye
    const currency = rates.find((r) => r.code === fromCurrency)
    if (currency) {
      return amount * currency.buying
    }
    return amount
  }

  if (fromCurrency !== "TRY" && toCurrency !== "TRY") {
    // Yabancı para biriminden yabancı para birimine
    const fromRate = rates.find((r) => r.code === fromCurrency)
    const toRate = rates.find((r) => r.code === toCurrency)
    if (fromRate && toRate) {
      // Önce TRY'ye çevir, sonra hedef para birimine
      const tryAmount = amount * fromRate.buying
      return tryAmount / toRate.selling
    }
    return amount
  }

  return amount
}
