'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminLogin() {
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
  
  // Gerçek kullanıcı bilgileri
  const SECURITY_QUESTION = "İlk evcil hayvanınızın adı nedir?";
  const SECURITY_ANSWER = "limon"; // Gerçek cevap
  const ADMIN_EMAIL = "passionistravell@gmail.com"; // Gerçek email adresi
  const DEFAULT_USERNAME = "arzum"; // Varsayılan kullanıcı adı
  
  const router = useRouter();

  // Rastgele 6 haneli doğrulama kodu oluşturma
  const generateVerificationCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    return code;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Önce localStorage'dan özel şifreyi kontrol et
      const customPassword = localStorage.getItem('adminPassword');
      
      // localStorage'dan özel kullanıcı adını kontrol et
      const customUsername = localStorage.getItem('adminUsername');
      
      // Kullanıcı adını ve şifreyi kontrol et
      let isCorrectUsername = false;
      
      // Özel kullanıcı adı varsa onu kontrol et, yoksa varsayılan kullanıcı adını kontrol et
      if (customUsername) {
        isCorrectUsername = username.toLowerCase() === customUsername.toLowerCase();
      } else {
        isCorrectUsername = username.toLowerCase() === DEFAULT_USERNAME.toLowerCase();
      }
      
      let isCorrectPassword = false;
      
      // Özel şifre varsa onu kontrol et, yoksa varsayılan şifreyi kontrol et
      if (customPassword) {
        isCorrectPassword = password === customPassword;
      } else {
        isCorrectPassword = password === 'Arzumalan1965';
      }
      
      if (isCorrectUsername && isCorrectPassword) {
        // Başarılı giriş
        localStorage.setItem('adminLoggedIn', 'true');
        // doğrudan window.location ile yönlendirme yap
        window.location.href = '/admin/dashboard';
      } else {
        setError('Kullanıcı adı veya şifre hatalı!');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      setIsLoading(false);
    }
  };

  const handleResetPassword = () => {
    setIsResetting(true);
    setResetStep('security-question');
    setSecurityQuestion(SECURITY_QUESTION);
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
    if (securityAnswer.toLowerCase() === SECURITY_ANSWER.toLowerCase()) {
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
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
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

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Yeni şifre kontrolü
    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    
    // Şifre eşleşme kontrolü
    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }
    
    // Şifre sıfırlama işlemi
    try {
      // Şifre değişikliğini localStorage'a kaydet
      localStorage.setItem('adminPassword', newPassword);
      setSuccessMessage('Şifre başarıyla sıfırlandı! Yeni şifrenizle giriş yapabilirsiniz.');
      
      // Form alanlarını temizle
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      
      // 3 saniye sonra login ekranına dön
      setTimeout(() => {
        setIsResetting(false);
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      setError('Şifre sıfırlama işlemi başarısız oldu.');
    }
  };

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
                          placeholder="E-postanıza gönderilen kodu girin"
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}