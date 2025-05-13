'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdminCredentials } from "@/lib/db-firebase";
import { clientInitializeFirebase } from "@/lib/firebase";

// Admin login bileşeni
export default function AdminLogin() {
  // Firebase durumu için state
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  
  // Firebase'i başlatmak için useEffect kullan
  useEffect(() => {
    try {
      console.log("Admin login sayfasında Firebase başlatılıyor...");
      const success = clientInitializeFirebase();
      console.log("Firebase başlatma sonucu:", success ? "Başarılı" : "Başarısız");
      setFirebaseInitialized(success);
    } catch (error) {
      console.error("Firebase başlatma hatası:", error);
    }
  }, []);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState<'security-question' | 'email-verification' | 'set-password'>('security-question');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [showEmailCode, setShowEmailCode] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetCode, setShowResetCode] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [usernameResetStep, setUsernameResetStep] = useState<'email-verification' | 'set-username'>('email-verification');
  const [usernameEmail, setUsernameEmail] = useState('');
  const [usernameEmailSent, setUsernameEmailSent] = useState(false);
  const [usernameVerificationCode, setUsernameVerificationCode] = useState('');
  const [usernameShowEmailCode, setUsernameShowEmailCode] = useState(false);
  const [usernameSuccessMessage, setUsernameSuccessMessage] = useState('');
  const [newUsernameForReset, setNewUsernameForReset] = useState('');
  const [isUsernameResetting, setIsUsernameResetting] = useState(false);

  const router = useRouter();

  // Rastgele 6 haneli doğrulama kodu oluşturma
  const generateVerificationCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    return code;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();    setIsLoading(true);
    setError('');
    
    // Firebase başlatılmadıysa işlemi durduralım
    if (!firebaseInitialized) {
      setError('Firebase bağlantısı kurulamadı. Lütfen sayfayı yenileyin.');
      setIsLoading(false);
      return;
    }
    
    try {
      // Kullanıcı adı ve şifre kontrolü
      if (username.trim().length < 3) {
        setError('Kullanıcı adı en az 3 karakter olmalı.');
        setIsLoading(false);
        return;
      }
      if (password.trim().length < 6) {
        setError('Şifre en az 6 karakter olmalı.');
        setIsLoading(false);
        return;
      }
      
      // API'den admin kimlik bilgileri kontrolü yapalım
      try {
        console.log("API'ye admin giriş isteği gönderiliyor...");
        const response = await fetch('/api/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
          if (response.ok && result.success) {
          // Giriş başarılı
          console.log("Admin girişi başarılı");
          localStorage.setItem('adminLoggedIn', 'true');
          window.location.href = '/admin/dashboard';
          return;
        }
        
        // Giriş başarısız olduysa hata mesajını göster
        setError(result.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        setIsLoading(false);
        return;      } catch (apiError) {
        // API hatası durumunda manuel olarak kimlik doğrulama yapalım
        console.warn("API hatası, doğrudan Firebase'den kimlik doğrulama deneniyor:", apiError);
        try {
          const adminCreds = await getAdminCredentials();
                // Admin kimlik bilgileri var mı kontrol et
          if (!adminCreds || !adminCreds.username) {
            console.error("Admin kimlik bilgileri bulunamadı");
            setError('Admin kimlik bilgileri bulunamadı. Lütfen yetkili ile iletişime geçin.');
            setIsLoading(false);
            return;
          }
          
          // Kullanıcı adı ve şifre kontrolü
          if (adminCreds.username === username && adminCreds.password === password) {
            // Giriş başarılı
            console.log("Admin girişi başarılı");
            localStorage.setItem('adminLoggedIn', 'true');
            window.location.href = '/admin/dashboard';
          } else {
            // Giriş başarısız
            setError('Kullanıcı adı veya şifre hatalı!');
            setIsLoading(false);
          }
        } catch (dbError) {
          console.error("Firebase'den admin bilgileri alma hatası:", dbError);
          setError('Veritabanı bağlantı hatası. Lütfen tekrar deneyin.');
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error("Giriş işlemi sırasında hata:", err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      setIsLoading(false);
    }
  };

  const handleResetPassword = () => {
    setIsResetting(true);
    setResetStep('security-question');
    setSecurityQuestion('');
    setError('');
    setSuccessMessage('');
  };

  const handleCancelReset = () => {
    setIsResetting(false);
    setResetStep('security-question');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setSecurityAnswer('');
    setEmail('');
    setEmailVerificationCode('');
    setError('');
    setSuccessMessage('');
    setEmailSent(false);
  };

  const handleSecurityQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Güvenlik sorusu kontrolü
    if (securityAnswer.toLowerCase() === '') {
      // Güvenlik sorusu doğru ise, şifre sıfırlama adımına geç
      setResetStep('set-password');
    } else {
      setError('Güvenlik sorusuna verilen cevap yanlış.');
    }
  };

  const handleForgotSecurityAnswer = () => {
    setResetStep('email-verification');
    setError('');
  };

  const handleSendEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // E-posta kontrolü
    if (email.toLowerCase() === '') {
      try {
        // Doğrulama kodu oluştur
        const code = generateVerificationCode();

        // API'ye istek gönder
        try {
          const response = await fetch('/api/send-verification-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
          });
          
          const result = await response.json();
          
          if (response.ok) {
            setEmailSent(true);
            setIsLoading(false);
            setSuccessMessage(`Doğrulama kodu ${email} adresine gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.`);
          } else {
            // API hatası
            console.error('Email API error:', result.error);
            setError(`E-posta gönderilirken bir hata oluştu: ${result.error || 'Bilinmeyen hata'}`);
            setIsLoading(false);
          }
        } catch (apiError) {
          // API hatası
          console.error('Email API error:', apiError);
          setError('E-posta gönderimi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Email sending error:', error);
        setError('E-posta gönderilirken bir hata oluştu.');
        setIsLoading(false);
      }
    } else {
      setError('Girilen e-posta adresi kayıtlı değil.');
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // E-posta doğrulama kodu kontrolü
    if (emailVerificationCode === verificationCode) {
      // Doğrulama kodu doğru ise, şifre sıfırlama adımına geç
      setResetStep('set-password');
      setSuccessMessage('');
    } else {
      setError('Doğrulama kodu hatalı.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }
    try {
      // Şifre sıfırlama API'sine gönder
      const response = await fetch('/api/set-admin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, email })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSuccessMessage('Şifre başarıyla sıfırlandı! Yeni şifrenizle giriş yapabilirsiniz.');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsResetting(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(result.error || 'Şifre sıfırlama işlemi başarısız oldu.');
      }
    } catch (error) {
      setError('Şifre sıfırlama işlemi başarısız oldu.');
    }
  };

  const handleUsernameReset = () => {
    setIsUsernameResetting(true);
    setUsernameResetStep('email-verification');
    setUsernameEmail('');
    setUsernameEmailSent(false);
    setUsernameVerificationCode('');
    setUsernameShowEmailCode(false);
    setUsernameSuccessMessage('');
    setNewUsernameForReset('');
    setError('');
  };

  const handleSendUsernameEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const { username, password } = await getAdminCredentials();
    const adminEmail = 'passionistravell@gmail.com'; // Gerekirse Firestore'dan alın
    if (usernameEmail.toLowerCase() === adminEmail.toLowerCase()) {
      try {
        const code = generateVerificationCode();
        const response = await fetch('/api/send-verification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: usernameEmail, code })
        });
        const result = await response.json();
        if (response.ok) {
          setUsernameEmailSent(true);
          setIsLoading(false);
          setUsernameSuccessMessage(`Doğrulama kodu ${usernameEmail} adresine gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.`);
        } else {
          setError(`E-posta gönderilirken bir hata oluştu: ${result.error || 'Bilinmeyen hata'}`);
          setIsLoading(false);
        }
      } catch (error) {
        setError('E-posta gönderilirken bir hata oluştu.');
        setIsLoading(false);
      }
    } else {
      setError('Girilen e-posta adresi kayıtlı değil.');
      setIsLoading(false);
    }
  };

  const handleVerifyUsernameEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (usernameVerificationCode === verificationCode) {
      setUsernameResetStep('set-username');
      setUsernameSuccessMessage('');
    } else {
      setError('Doğrulama kodu hatalı.');
    }
  };

  const handleUsernameResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newUsernameForReset.trim().length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalı.');
      return;
    }
    try {
      // Kullanıcı adı sıfırlama API'sine gönder
      const response = await fetch('/api/set-admin-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername: newUsernameForReset, verificationCode: usernameVerificationCode, email: usernameEmail })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setUsernameSuccessMessage('Kullanıcı adı başarıyla güncellendi!');
        setTimeout(() => {
          setIsUsernameResetting(false);
          setUsernameSuccessMessage('');
        }, 3000);
      } else {
        setError(result.error || 'Kullanıcı adı güncellenemedi.');
      }
    } catch (error) {
      setError('Kullanıcı adı güncellenemedi.');
    }
  };

  if (isUsernameResetting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle>Kullanıcı Adı Sıfırlama</CardTitle>
            <CardDescription>Kullanıcı adınızı yenilemek için aşağıdaki adımları izleyin</CardDescription>
          </CardHeader>
          <CardContent>
            {usernameResetStep === 'email-verification' && (
              <>
                {!usernameEmailSent ? (
                  <form onSubmit={handleSendUsernameEmailVerification} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="usernameEmail" className="text-sm font-medium">
                        E-posta Adresi
                      </label>
                      <Input
                        id="usernameEmail"
                        type="email"
                        value={usernameEmail}
                        onChange={(e) => setUsernameEmail(e.target.value)}
                        required
                        placeholder="Kayıtlı e-posta adresinizi girin"
                      />
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {usernameSuccessMessage && (
                      <Alert className="bg-green-50 text-green-800 border-green-200">
                        <AlertDescription>{usernameSuccessMessage}</AlertDescription>
                      </Alert>
                    )}
                    <div className="flex space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsUsernameResetting(false)} type="button">
                        İptal
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyUsernameEmail} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="usernameEmailCode" className="text-sm font-medium">
                        E-posta Doğrulama Kodu
                      </label>
                      <div className="relative">
                        <Input
                          id="usernameEmailCode"
                          type={usernameShowEmailCode ? "text" : "password"}
                          value={usernameVerificationCode}
                          onChange={(e) => setUsernameVerificationCode(e.target.value)}
                          required
                          placeholder="Doğrulama kodunu girin"
                        />
                        <button
                          type="button"
                          onClick={() => setUsernameShowEmailCode(!usernameShowEmailCode)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {usernameShowEmailCode ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {usernameSuccessMessage && (
                      <Alert className="bg-green-50 text-green-800 border-green-200">
                        <AlertDescription>{usernameSuccessMessage}</AlertDescription>
                      </Alert>
                    )}
                    <div className="flex space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsUsernameResetting(false)} type="button">
                        İptal
                      </Button>
                      <Button type="submit">
                        Doğrula ve Devam Et
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}
            {usernameResetStep === 'set-username' && (
              <form onSubmit={handleUsernameResetSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="newUsernameForReset" className="text-sm font-medium">
                    Yeni Kullanıcı Adı
                  </label>
                  <Input
                    id="newUsernameForReset"
                    type="text"
                    value={newUsernameForReset}
                    onChange={(e) => setNewUsernameForReset(e.target.value)}
                    required
                    placeholder="Yeni kullanıcı adınızı girin"
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {usernameSuccessMessage && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>{usernameSuccessMessage}</AlertDescription>
                  </Alert>
                )}
                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsUsernameResetting(false)} type="button">
                    İptal
                  </Button>
                  <Button type="submit">
                    Kullanıcı Adını Güncelle
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isResetting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle>Şifre Sıfırlama</CardTitle>
            <CardDescription>Şifrenizi sıfırlamak için aşağıdaki adımları izleyin</CardDescription>
          </CardHeader>
          <CardContent>
            {resetStep === 'security-question' && (
              <form onSubmit={handleSecurityQuestionSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="securityQuestion" className="text-sm font-medium">
                    Güvenlik Sorusu
                  </label>
                  <Input
                    id="securityQuestion"
                    type="text"
                    value={securityQuestion}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="securityAnswer" className="text-sm font-medium">
                    Cevabınız
                  </label>
                  <Input
                    id="securityAnswer"
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    required
                    placeholder="Güvenlik sorusunun cevabını girin"
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" onClick={handleCancelReset} type="button">
                    İptal
                  </Button>
                  <Button type="submit">
                    Devam Et
                  </Button>
                </div>
                
                <div className="text-center mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">
                    Güvenlik sorusunun cevabını hatırlamıyor musunuz?
                  </p>
                  <Button variant="link" onClick={handleForgotSecurityAnswer} type="button">
                    E-posta ile doğrulama yap
                  </Button>
                </div>
              </form>
            )}

            {resetStep === 'email-verification' && (
              <>
                {!emailSent ? (
                  <form onSubmit={handleSendEmailVerification} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        E-posta Adresi
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Kayıtlı e-posta adresinizi girin"
                      />
                    </div>
                    
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {successMessage && (
                      <Alert className="bg-green-50 text-green-800 border-green-200">
                        <AlertDescription>{successMessage}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex space-x-2 pt-4">
                      <Button variant="outline" onClick={handleCancelReset} type="button">
                        İptal
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyEmail} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="emailCode" className="text-sm font-medium">
                        E-posta Doğrulama Kodu
                      </label>
                      <div className="relative">
                        <Input
                          id="emailCode"
                          type={showEmailCode ? "text" : "password"}
                          value={emailVerificationCode}
                          onChange={(e) => setEmailVerificationCode(e.target.value)}
                          required
                          placeholder="Doğrulama kodunu girin"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmailCode(!showEmailCode)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showEmailCode ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {successMessage && (
                      <Alert className="bg-green-50 text-green-800 border-green-200">
                        <AlertDescription>{successMessage}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex space-x-2 pt-4">
                      <Button variant="outline" onClick={handleCancelReset} type="button">
                        İptal
                      </Button>
                      <Button type="submit">
                        Doğrula ve Devam Et
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}
            
            {resetStep === 'set-password' && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
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
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Yeni Şifre (Tekrar)
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {successMessage && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" onClick={handleCancelReset} type="button">
                    İptal
                  </Button>
                  <Button type="submit">
                    Şifreyi Sıfırla
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Admin Girişi</CardTitle>
          <CardDescription>Yönetim paneline erişmek için giriş yapın</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Kullanıcı Adı
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Kullanıcı adınızı girin"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Şifre
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Şifrenizi girin"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </Button>
            
            <div className="text-center mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">
                Şifrenizi mi unuttunuz?
              </p>
              <Button variant="link" onClick={handleResetPassword} type="button">
                Şifremi Sıfırla
              </Button>
              <span className="mx-2">|</span>
              <Button variant="link" onClick={handleUsernameReset} type="button">
                Kullanıcı Adını Unuttum
              </Button>
            </div>          </form>
        </CardContent>
      </Card>    </div>
  );
}