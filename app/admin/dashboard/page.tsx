'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [showResetCode, setShowResetCode] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Sabit şifre sıfırlama kodu: 123456
  const RESET_CODE = '123456';

  useEffect(() => {
    try {
      // Giriş kontrolü
      const isLoggedIn = localStorage.getItem('adminLoggedIn');
      if (!isLoggedIn) {
        window.location.href = '/admin/login';
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Dashboard access error:', err);
      window.location.href = '/admin/login';
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = '/admin/login';
  };

  const handleStartApp = () => {
    // Ana uygulamaya yönlendir
    window.location.href = '/';
  };

  const handleChangePassword = () => {
    setIsChangingPassword(true);
    setIsResettingPassword(false);
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleResetPassword = () => {
    setIsResettingPassword(true);
    setIsChangingPassword(false);
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setIsResettingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setResetCode('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleSavePassword = () => {
    setPasswordError('');
    
    // Mevcut şifre kontrolü
    if (currentPassword !== 'Arzumalan1965') {
      // Ayrıca localStorage'dan da kontrol et
      const customPassword = localStorage.getItem('adminPassword');
      if (customPassword && currentPassword !== customPassword) {
        setPasswordError('Mevcut şifre hatalı!');
        return;
      }
    }
    
    // Yeni şifre kontrolü
    if (newPassword.length < 6) {
      setPasswordError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    
    // Şifre eşleşme kontrolü
    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor.');
      return;
    }
    
    // Şifre değiştirme işlemi (normalde API'ye gönderilirdi)
    try {
      // Şifre değişikliğini localStorage'a kaydet (gerçek uygulamada backend'e kaydedilmeli)
      localStorage.setItem('adminPassword', newPassword);
      setPasswordSuccess('Şifre başarıyla değiştirildi!');
      
      // Form alanlarını temizle
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // 3 saniye sonra password change modunu kapat
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess('');
      }, 3000);
    } catch (error) {
      setPasswordError('Şifre değiştirme işlemi başarısız oldu.');
    }
  };

  const handlePasswordReset = () => {
    setPasswordError('');
    
    // Reset kodu kontrolü
    if (resetCode !== RESET_CODE) {
      setPasswordError('Şifre sıfırlama kodu hatalı!');
      return;
    }
    
    // Yeni şifre kontrolü
    if (newPassword.length < 6) {
      setPasswordError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    
    // Şifre eşleşme kontrolü
    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor.');
      return;
    }
    
    // Şifre sıfırlama işlemi
    try {
      // Şifre değişikliğini localStorage'a kaydet
      localStorage.setItem('adminPassword', newPassword);
      setPasswordSuccess('Şifre başarıyla sıfırlandı!');
      
      // Form alanlarını temizle
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      
      // 3 saniye sonra password reset modunu kapat
      setTimeout(() => {
        setIsResettingPassword(false);
        setPasswordSuccess('');
      }, 3000);
    } catch (error) {
      setPasswordError('Şifre sıfırlama işlemi başarısız oldu.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Yükleniyor...</h1>
          <p>Lütfen bekleyin...</p>
        </div>
      </div>
    );
  }

  if (isChangingPassword) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Şifre Değiştir</CardTitle>
              <CardDescription>Yönetici hesabınızın şifresini değiştirin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-sm font-medium">
                    Mevcut Şifre
                  </label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium">
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Yeni Şifre (Tekrar)
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}
                
                {passwordSuccess && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>{passwordSuccess}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" onClick={handleCancelPasswordChange}>
                    İptal
                  </Button>
                  <Button onClick={handleSavePassword}>
                    Şifreyi Değiştir
                  </Button>
                </div>

                <div className="text-center mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">
                    Mevcut şifrenizi hatırlamıyor musunuz?
                  </p>
                  <Button variant="link" onClick={handleResetPassword}>
                    Şifremi Unuttum
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isResettingPassword) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Şifre Sıfırlama</CardTitle>
              <CardDescription>Şifrenizi sıfırlamak için aşağıdaki adımları izleyin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
                  <AlertDescription>
                    Şifre sıfırlama kodu: <strong>123456</strong><br />
                    (Bu bir demo olduğu için sabit kod kullanılmıştır.)
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <label htmlFor="resetCode" className="text-sm font-medium">
                    Şifre Sıfırlama Kodu
                  </label>
                  <div className="relative">
                    <Input
                      id="resetCode"
                      type={showResetCode ? "text" : "password"}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                      placeholder="Sıfırlama kodunu girin"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetCode(!showResetCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showResetCode ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="newPasswordReset" className="text-sm font-medium">
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <Input
                      id="newPasswordReset"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Yeni şifrenizi girin"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="confirmPasswordReset" className="text-sm font-medium">
                    Yeni Şifre (Tekrar)
                  </label>
                  <Input
                    id="confirmPasswordReset"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                </div>
                
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}
                
                {passwordSuccess && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>{passwordSuccess}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" onClick={handleCancelPasswordChange}>
                    İptal
                  </Button>
                  <Button onClick={handlePasswordReset}>
                    Şifreyi Sıfırla
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Paneli</h1>
          <div className="flex space-x-2">
            <Button onClick={handleChangePassword} variant="outline">
              Şifre Değiştir
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Çıkış Yap
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>Uygulamaya Başla</CardTitle>
              <CardDescription>Tur ve gider yönetim uygulamasını başlatın</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full text-lg py-8" onClick={handleStartApp}>
                Uygulamayı Başlat
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Şifrenizi mi unuttunuz? <Button variant="link" className="p-0 h-auto" onClick={handleResetPassword}>Şifremi Sıfırla</Button></p>
        </div>
      </div>
    </div>
  );
} 