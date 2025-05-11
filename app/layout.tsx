// This is the new ROOT layout for the entire app.
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";
// Firebase başlatma
import firebase from "@/lib/firebase";
import { initializeDB } from "@/lib/db"; // Bu işlev artık Firebase için çalışacak

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
                  console.log("Firebase veritabanı başlatılıyor...");
                  await initializeDB();
                  console.log("Firebase veritabanı hazır!");
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
