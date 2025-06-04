"use client";

import { useAuth } from '../lib/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog"
import { useState } from 'react';
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

interface SignInModalProps {
  onClose: () => void;
}

export default function SignInModal({ onClose }: SignInModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [showEmailSignIn, setShowEmailSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isGoogleSignInLoading, setIsGoogleSignInLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmail(email, password);
      onClose();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    try {
      await signUpWithEmail(email, password);
      onClose();
    } catch (error) {
      console.error('Error signing up:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSignInLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Error signing in with Google:', error);
    } finally {
      setIsGoogleSignInLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white p-0 overflow-hidden border-none">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-blue-600" />

        <div className="p-6 space-y-8">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-center">
              {showSignUp ? 'Crear una cuenta' : 'Inicia sesión para continuar'}
            </DialogTitle>
            <DialogDescription className="text-center">
              Accede a todas las funcionalidades de Legal AI Quote
            </DialogDescription>
          </DialogHeader>

          {!showEmailSignIn && !showSignUp && (
            <>
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden">
                    <img
                      src='/blue-logo.png'
                      alt="AI Quote Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">Cotizaciones en minutos</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">Análisis con IA</span>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Continuar con</span>
                  </div>
                </div>

                <div className="flex justify-center">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleSignInLoading}
                  className="flex items-center justify-center w-full px-6 py-3 text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGoogleSignInLoading ? (
                    <div className="w-5 h-5 mr-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  <span className="text-sm font-medium">
                    {isGoogleSignInLoading ? 'Iniciando sesión...' : 'Continuar con Google'}
                  </span>
                </button>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setShowEmailSignIn(true)}
                  className="flex items-center justify-center w-full px-6 py-3 text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium">Iniciar sesión con email</span>
                </button>

                <div className="text-center">
                  <button
                    onClick={() => setShowSignUp(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    ¿Todavía no tienes una cuenta? Regístrate
                  </button>
                </div>
              </div>
            </>
          )}

          {(showEmailSignIn || showSignUp) && (
            <form onSubmit={showSignUp ? handleSignUp : handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {showSignUp && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                {showSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailSignIn(false);
                    setShowSignUp(false);
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-700 hover:underline"
                >
                  Volver a las opciones de inicio de sesión
                </button>
              </div>
            </form>
          )}

          <p className="text-xs text-center text-gray-500 mt-8">
            Al continuar, aceptas nuestros{' '}
            <a href="#" className="text-blue-600 hover:underline">Términos de servicio</a>
            {' '}y{' '}
            <a href="#" className="text-blue-600 hover:underline">Política de privacidad</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}