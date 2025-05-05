// This is the new ROOT layout for the entire app.
import type { Metadata } from 'next'
import './globals.css';
import { Inter } from 'next/font/google'
import SessionProvider from "@/components/providers/session-provider";

// Inter fontunu yükle
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Passionis Travel',
  description: 'Seyahat Acentesi Yönetim Sistemi',
};

// RootLayout'u async yap
export default function RootLayout({ 
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
