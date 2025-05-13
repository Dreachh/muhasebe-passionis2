'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { LogOut, LogOutIcon, RefreshCw } from 'lucide-react';

export function AdminHeader() {
  const { toast } = useToast();
  const router = useRouter();
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Tüm oturumları sonlandırma
  const handleLogoutAll = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/admin/logout-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Başarılı",
          description: "Tüm admin oturumları sonlandırıldı",
        });
        
        // Temizlik işlemlerini yap
        localStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminLoggedIn');
        document.cookie = "adminLoggedInClient=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        // Login sayfasına yönlendir
        router.push('/admin/login');
      } else {
        toast({
          title: "Hata",
          description: data.error || "İşlem sırasında bir hata oluştu",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Oturum sonlandırma hatası:", error);
      toast({
        title: "Hata",
        description: "Oturumları sonlandırma sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
      setShowLogoutAllDialog(false);
    }
  };
  
  // Normal çıkış işlemi
  const handleLogout = () => {
    // Temizlik işlemleri
    localStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminLoggedIn');
    document.cookie = "adminLoggedInClient=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "session_version=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Login sayfasına yönlendir
    router.push('/admin/login');
  };
  
  return (
    <>
      <div className="bg-slate-100 border-b border-slate-200 p-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Admin Panel</h2>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowLogoutAllDialog(true)}
            className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden md:inline">Tüm Oturumları Sonlandır</span>
            <span className="inline md:hidden">Tüm Oturumlar</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" />
            <span>Çıkış Yap</span>
          </Button>
        </div>
      </div>
      
      <AlertDialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tüm oturumları sonlandır</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem, tüm cihazlardaki ve tarayıcılardaki admin oturumlarını sonlandıracak.
              Herkes yeniden giriş yapmak zorunda kalacak.
              <br /><br />
              Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleLogoutAll();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'İşlem yapılıyor...' : 'Tüm Oturumları Sonlandır'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
