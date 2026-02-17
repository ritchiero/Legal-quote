"use client";

import { useAuth } from '../lib/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

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

  const resetToMain = () => {
    setShowEmailSignIn(false);
    setShowSignUp(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[420px] p-0 overflow-hidden"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E9EEF5',
          borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(16,24,40,0.14)',
        }}
      >
        {/* Top accent line — Primary gradient B */}
        <div
          className="h-[3px] w-full"
          style={{
            background: 'linear-gradient(90deg, #B0C0F0 0%, #D8A0F8 50%, #F89050 100%)',
          }}
        />

        <div className="px-8 pt-7 pb-8 space-y-6">
          {/* Header */}
          <DialogHeader className="space-y-2 text-center">
            <DialogTitle
              className="text-[22px] font-extrabold tracking-[-0.02em] text-[#0B0F1A]"
            >
              {showSignUp ? 'Crear una cuenta' : showEmailSignIn ? 'Inicia sesión con email' : 'Inicia sesión para continuar'}
            </DialogTitle>
            {!showEmailSignIn && !showSignUp && (
              <DialogDescription className="text-[14px] text-[#7C86A4] leading-[1.5]">
                Accede a todas las funcionalidades de Legal AI Quote
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Main screen */}
          {!showEmailSignIn && !showSignUp && (
            <div className="space-y-5">
              {/* Logo + feature chips */}
              <div className="flex flex-col items-center space-y-4">
                <div
                  className="w-14 h-14 rounded-[14px] flex items-center justify-center overflow-hidden"
                  style={{
                    background: '#F2F8FF',
                    border: '1px solid #DDE8FD',
                  }}
                >
                  <img src='/blue-logo.png' alt="Legal AI Quote" className="w-10 h-10 object-contain" />
                </div>

                {/* Feature pills — DS chips */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {['Cotizaciones en minutos', 'Análisis con IA'].map((feat) => (
                    <span
                      key={feat}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-full"
                      style={{
                        background: '#E8F2FC',
                        color: '#3C65E2',
                        border: '1px solid #DDE8FD',
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full" style={{ borderTop: '1px solid #E9EEF5' }} />
                </div>
                <div className="relative flex justify-center text-[12px]">
                  <span className="px-3 bg-white text-[#7C86A4] font-medium">Continuar con</span>
                </div>
              </div>

              {/* Google button — primary pill */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isGoogleSignInLoading}
                className="flex items-center justify-center w-full px-6 py-3.5 font-semibold text-[14px] text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-[1px]"
                style={{
                  background: '#3C65E2',
                  borderRadius: '9999px',
                  boxShadow: '0 8px 24px rgba(16,24,40,0.08)',
                }}
              >
                {isGoogleSignInLoading ? (
                  <div className="w-5 h-5 mr-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#ffffff" fillOpacity="0.9" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#ffffff" fillOpacity="0.75" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#ffffff" fillOpacity="0.6" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ffffff" fillOpacity="0.9" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {isGoogleSignInLoading ? 'Iniciando sesión...' : 'Continuar con Google'}
              </button>

              {/* Email button — secondary pill */}
              <button
                onClick={() => setShowEmailSignIn(true)}
                className="flex items-center justify-center w-full px-6 py-3.5 font-semibold text-[14px] transition-all duration-200 hover:bg-[#F2F8FF] hover:-translate-y-[0.5px]"
                style={{
                  color: '#0B0F1A',
                  background: '#FFFFFF',
                  borderRadius: '9999px',
                  border: '1px solid #E9EEF5',
                  boxShadow: '0 1px 2px rgba(16,24,40,0.06)',
                }}
              >
                <svg className="w-4.5 h-4.5 mr-2.5 text-[#7C86A4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ width: '18px', height: '18px', marginRight: '10px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Iniciar sesión con email
              </button>

              {/* Sign up link */}
              <p className="text-center text-[13px] text-[#7C86A4]">
                ¿Sin cuenta?{' '}
                <button
                  onClick={() => setShowSignUp(true)}
                  className="font-semibold text-[#3C65E2] hover:text-[#4056BE] transition-colors"
                >
                  Regístrate gratis
                </button>
              </p>
            </div>
          )}

          {/* Email sign-in / sign-up form */}
          {(showEmailSignIn || showSignUp) && (
            <form onSubmit={showSignUp ? handleSignUp : handleEmailSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#0B0F1A]">Email</label>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 text-[14px] text-[#0B0F1A] placeholder:text-[#C0C3CF] focus-visible:ring-[#3C65E2]"
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #E9EEF5',
                    background: '#F2F8FF',
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#0B0F1A]">Contraseña</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 text-[14px] text-[#0B0F1A] placeholder:text-[#C0C3CF] focus-visible:ring-[#3C65E2]"
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #E9EEF5',
                    background: '#F2F8FF',
                  }}
                />
              </div>

              {showSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#0B0F1A]">Confirmar Contraseña</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11 text-[14px] text-[#0B0F1A] placeholder:text-[#C0C3CF] focus-visible:ring-[#3C65E2]"
                    style={{
                      borderRadius: '10px',
                      border: '1px solid #E9EEF5',
                      background: '#F2F8FF',
                    }}
                  />
                </div>
              )}

              {/* Submit — DS pill primary */}
              <button
                type="submit"
                className="w-full py-3.5 font-semibold text-[14px] text-white transition-all duration-200 hover:-translate-y-[1px] mt-2"
                style={{
                  background: '#3C65E2',
                  borderRadius: '9999px',
                  boxShadow: '0 8px 24px rgba(16,24,40,0.08)',
                }}
              >
                {showSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>

              {/* Back link */}
              <button
                type="button"
                onClick={resetToMain}
                className="flex items-center justify-center gap-1.5 w-full text-[13px] text-[#7C86A4] hover:text-[#3C65E2] transition-colors mt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a las opciones
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="text-[11px] text-center text-[#C0C3CF] leading-relaxed">
            Al continuar, aceptas nuestros{' '}
            <a href="#" className="text-[#7C86A4] hover:text-[#3C65E2] underline underline-offset-2 transition-colors">
              Términos de servicio
            </a>
            {' '}y{' '}
            <a href="#" className="text-[#7C86A4] hover:text-[#3C65E2] underline underline-offset-2 transition-colors">
              Política de privacidad
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
