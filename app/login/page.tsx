'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/firebase-auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const signIn = auth.signin; // Büyük/küçük harf değişikliği
  const signInWithGoogle = auth.signinWithGoogle; // Büyük/küçük harf değişikliği
  const signUp = auth.signup; // Büyük/küçük harf değişikliği
  const authError = auth.error;
  // useAuth hook'undan gelen hata mesajlarını takip et
  useEffect(() => {
    if (authError) {
      setErrorMessage(authError);
    }
  }, [authError]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setErrorMessage('Lütfen email ve şifre giriniz.');
      return;
    }
    
    try {
      setLoginInProgress(true);
      setErrorMessage('');
      
      let user;
      
      if (isRegistering) {
        // Kayıt işlemi
        user = await signUp(email, password);
        if (user) {
          setErrorMessage('');
          // Kayıt başarılı olduğunda otomatik giriş yap
          user = await signIn(email, password);
        }
      } else {
        // Normal giriş işlemi
        user = await signIn(email, password);
      }
      
      if (user) {
        // Başarılı giriş işlemi
        // localStorage'a giriş durumunu kaydet
        localStorage.setItem('adminLoggedIn', 'true');
        
        // Ana sayfaya yönlendir
        router.push('/');
      } else {
        // Hata mesajı authError useEffect'inde yakalanacak
        // Ek bir hata mesajı gösteriyoruz
        if (!errorMessage) {
          setErrorMessage(isRegistering ? 
            'Kayıt oluşturulamadı. Lütfen bilgilerinizi kontrol ediniz.' : 
            'Giriş yapılamadı. Lütfen bilgilerinizi kontrol ediniz.');
        }
      }
    } catch (error: any) {
      console.error('İşlem hatası:', error);
      setErrorMessage(error.message || 'İşlem yapılamadı. Lütfen daha sonra tekrar deneyiniz.');
    } finally {
      setLoginInProgress(false);
    }
  };const handleGoogleLogin = async () => {
    try {
      setLoginInProgress(true);
      setErrorMessage('');
      
      const user = await signInWithGoogle();
      
      if (user) {
        // Başarılı Google girişi
        localStorage.setItem('adminLoggedIn', 'true');
        router.push('/');
      } else {
        // Hata mesajı authError useEffect'inde yakalanacak
        // Ek bir hata mesajı gösteriyoruz
        if (!errorMessage) {
          setErrorMessage('Google ile giriş yapılamadı.');
        }
      }
    } catch (error: any) {
      console.error('Google giriş hatası:', error);
      setErrorMessage(error.message || 'Google ile giriş yapılamadı.');
    } finally {
      setLoginInProgress(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-indigo-100">
      <div className="w-full max-w-md p-4">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <img src="/logo.svg" alt="Passionis Logo" className="h-16" />
            </div>
            <CardTitle className="text-2xl font-bold">Passionis Tour</CardTitle>
            <CardDescription>
              Sisteme giriş yapmak için bilgilerinizi giriniz
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert className="bg-red-50 text-red-800 border-red-200">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="E-mail adresiniz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loginInProgress}
                    autoComplete="email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Şifreniz"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={loginInProgress}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
                <Button
                type="submit"
                className="w-full"
                disabled={loginInProgress}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {loginInProgress 
                  ? (isRegistering ? "Kayıt Oluşturuluyor..." : "Giriş Yapılıyor...") 
                  : (isRegistering ? "Kayıt Ol" : "Giriş Yap")}
              </Button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {isRegistering 
                    ? "Zaten hesabınız var mı? Giriş yapın" 
                    : "Hesabınız yok mu? Kayıt olun"}
                </button>
              </div>
            </form>
          </CardContent>
            <CardFooter className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loginInProgress}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                   alt="Google" className="mr-2 h-4 w-4" />
              Google ile Giriş Yap
            </Button>
            
            <p className="text-center text-xs text-muted-foreground">
              Sadece yetkili kullanıcılar giriş yapabilir.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
