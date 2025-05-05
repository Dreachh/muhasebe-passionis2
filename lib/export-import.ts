// Verileri dışa aktarma
export const exportData = async () => {
  try {
    // Tüm verileri topla
    const financialData = localStorage.getItem("financialData")
    const toursData = localStorage.getItem("toursData")
    const customerData = localStorage.getItem("customerData")
    const companyInfo = localStorage.getItem("companyInfo")
    const preferences = localStorage.getItem("preferences")
    const destinations = localStorage.getItem("destinations")
    const activities = localStorage.getItem("activities")
    const providers = localStorage.getItem("providers")
    const expenseTypes = localStorage.getItem("expenseTypes")

    const exportData = {
      financialData: financialData ? JSON.parse(financialData) : [],
      toursData: toursData ? JSON.parse(toursData) : [],
      customerData: customerData ? JSON.parse(customerData) : [],
      companyInfo: companyInfo ? JSON.parse(companyInfo) : {},
      preferences: preferences ? JSON.parse(preferences) : {},
      destinations: destinations ? JSON.parse(destinations) : [],
      activities: activities ? JSON.parse(activities) : [],
      providers: providers ? JSON.parse(providers) : [],
      expenseTypes: expenseTypes ? JSON.parse(expenseTypes) : [],
      exportDate: new Date().toISOString(),
    }

    // JSON dosyasını oluştur
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    // Dosyayı indir
    const exportFileDefaultName = `passionistour_backup_${new Date().toISOString().split("T")[0]}.json`
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()

    return true
  } catch (error) {
    console.error("Dışa aktarma hatası:", error)
    throw error
  }
}

// Verileri içe aktarma
export const importData = async () => {
  return new Promise((resolve, reject) => {
    try {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".json"

      input.onchange = (e) => {
        const file = e.target.files[0]
        if (!file) {
          reject(new Error("Dosya seçilmedi"))
          return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result)

            // Verileri doğrula
            if (!data.financialData || !data.toursData) {
              reject(new Error("Geçersiz yedek dosyası"))
              return
            }

            // Verileri kaydet
            localStorage.setItem("financialData", JSON.stringify(data.financialData))
            localStorage.setItem("toursData", JSON.stringify(data.toursData))
            
            if (data.customerData) {
              localStorage.setItem("customerData", JSON.stringify(data.customerData))
            }

            if (data.companyInfo) {
              localStorage.setItem("companyInfo", JSON.stringify(data.companyInfo))
            }

            if (data.preferences) {
              localStorage.setItem("preferences", JSON.stringify(data.preferences))
            }
            
            if (data.destinations) {
              localStorage.setItem("destinations", JSON.stringify(data.destinations))
            }
            
            if (data.activities) {
              localStorage.setItem("activities", JSON.stringify(data.activities))
            }
            
            if (data.providers) {
              localStorage.setItem("providers", JSON.stringify(data.providers))
            }
            
            if (data.expenseTypes) {
              localStorage.setItem("expenseTypes", JSON.stringify(data.expenseTypes))
            }

            resolve(true)
          } catch (error) {
            reject(new Error("Dosya ayrıştırma hatası: " + error.message))
          }
        }

        reader.onerror = () => {
          reject(new Error("Dosya okuma hatası"))
        }

        reader.readAsText(file)
      }

      input.click()
    } catch (error) {
      reject(error)
    }
  })
}

