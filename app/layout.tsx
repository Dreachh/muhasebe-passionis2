// This is the new ROOT layout for the entire app.
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";
// Firebase başlatma
import { initializeFirebase } from "@/lib/firebase";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Passionis Tour - Seyahat Turizm Muhasebe Yazılımı",
  description: "Passionis Tour için özel olarak geliştirilmiş turizm muhasebe yazılımı",
};

export default function RootLayout({ children, params: { locale } }) {
  return (
    <html lang={locale ?? "tr"} suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light">
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Firebase başlatma ve veritabanını hazırlama
              document.addEventListener('DOMContentLoaded', async function() {
                try {
                  if (typeof initializeFirebase === 'function') {
                    console.log("Firebase başlatma fonksiyonu çağrılıyor...");
                    window.firestore = initializeFirebase();
                    console.log("Firebase veritabanı başarıyla başlatıldı!");
                  } else {
                    console.error("Firebase başlatma fonksiyonu bulunamadı!");
                  }
                } catch (error) {
                  console.error("Firebase veritabanı başlatılırken hata:", error);
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
