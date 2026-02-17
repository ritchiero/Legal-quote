"use client"

import QuoteFormAnimation from "@/components/landing/quoteFormAnimation"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import HeroSection from "@/components/landing/HeroSection"
import FeaturesSection from "@/components/landing/FeaturesSection"
import CaseDetailsAnimation from "@/components/landing/CaseDetailsAnimation"
import SignInModal from "@/components/SignInModal"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export default function LandingPage() {
  const [showSignInDialog, setShowSignInDialog] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <div className="flex flex-col min-h-screen font-jakarta bg-white scroll-smooth">
      {/* Navbar — bg Navy-900, white text, pill CTA */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#101836]/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => scrollToSection('hero')} className="flex items-center gap-2">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20iaquote-tqPMRrgbnkZhPAhI98N3aTCq6j1SqR.png"
                alt="Legal AI Quote Logo"
                className="h-8"
              />
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-sm text-white/70 hover:text-white transition-colors font-medium">
                Características
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm text-white/70 hover:text-white transition-colors font-medium">
                Cómo Funciona
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm text-white/70 hover:text-white transition-colors font-medium">
                Precios
              </button>
              <button
                className="border border-[#3C65E2] text-[#3C65E2] hover:bg-[#3C65E2] hover:text-white px-5 py-2 rounded-full text-sm font-semibold transition-all"
                onClick={() => setShowSignInDialog(true)}
              >
                Iniciar Sesión
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/10">
              <div className="flex flex-col gap-4">
                <button onClick={() => scrollToSection('features')} className="text-sm text-white/70 hover:text-white transition-colors text-left font-medium">
                  Características
                </button>
                <button onClick={() => scrollToSection('how-it-works')} className="text-sm text-white/70 hover:text-white transition-colors text-left font-medium">
                  Cómo Funciona
                </button>
                <button onClick={() => scrollToSection('pricing')} className="text-sm text-white/70 hover:text-white transition-colors text-left font-medium">
                  Precios
                </button>
                <button
                  className="border border-[#3C65E2] text-[#3C65E2] hover:bg-[#3C65E2] hover:text-white px-5 py-2 rounded-full text-sm font-semibold transition-all w-fit"
                  onClick={() => { setShowSignInDialog(true); setMobileMenuOpen(false); }}
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 pt-16">
        <HeroSection />
        <FeaturesSection />

        {/* How it Works — Fondo 3 (Soft Blue) */}
        <section id="how-it-works" aria-label="Cómo funciona" className="w-full py-[72px] md:py-[96px] bg-[#F2F8FF] scroll-mt-20">
          <div className="container px-4 md:px-6 mx-auto space-y-12">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-[40px] lg:text-[48px] font-extrabold tracking-[-0.02em] leading-[1.15] text-[#0B0F1A]">
                ¿Cómo Funciona?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[#7C86A4] leading-[1.7]">
                Solo completa 9 campos y obtén tu cotización al instante
              </p>
            </div>
            <QuoteFormAnimation />
          </div>
        </section>

        {/* Pricing — Fondo 5 (Contact Mist) gradient */}
        <section id="pricing" aria-label="Precios" className="w-full py-[72px] md:py-[96px] bg-gradient-to-b from-white to-[#F2F8FF] scroll-mt-20">
          <div className="container px-4 md:px-6 mx-auto overflow-x-hidden">
            <div className="flex flex-col items-center justify-center space-y-8 text-center max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-[40px] lg:text-[48px] font-extrabold tracking-[-0.02em] leading-[1.15] text-[#3C65E2]">
                ¿En serio quieres seguir haciendo tus cotizaciones sin IA?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[#7C86A4] mt-4 leading-[1.7]">
                Una sola licencia incluye todo lo que necesitas para transformar tu despacho
              </p>

              {/* Product Pills — chip style */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-8">
                <div className="px-3 sm:px-4 py-2 bg-[#E8F2FC] rounded-full">
                  <p className="text-[#3C65E2] font-semibold text-sm sm:text-base">Legal AI Tools</p>
                </div>
                <span className="text-[#3C65E2]">+</span>
                <div className="px-3 sm:px-4 py-2 bg-[#E8F2FC] rounded-full">
                  <p className="text-[#3C65E2] font-semibold text-sm sm:text-base">Educación Legal</p>
                </div>
                <span className="text-[#3C65E2]">+</span>
                <div className="px-3 sm:px-4 py-2 bg-[#E8F2FC] rounded-full">
                  <p className="text-[#3C65E2] font-semibold text-sm sm:text-base">Legal Track</p>
                </div>
              </div>

              {/* Price */}
              <div className="text-center space-y-4">
                <p className="text-4xl font-extrabold text-[#3C65E2]">
                  $450<span className="text-xl font-normal text-[#7C86A4]"> pesos/mes</span>
                </p>
                <p className="text-lg text-[#0B0F1A] font-bold">Una sola licencia incluye:</p>
              </div>

              {/* Product Cards — DS card style */}
              <div className="space-y-6 w-full">
                {/* Cursos Card */}
                <div className="bg-white border border-[#E9EEF5] rounded-[16px] p-6 transition-all duration-200 hover:border-[#DDE8FD] hover:shadow-[0_8px_24px_rgba(16,24,40,0.08)]" style={{ boxShadow: '0 1px 2px rgba(16,24,40,0.06)' }}>
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/2">
                      <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-04%20at%204.49.11%E2%80%AFPM-ylKXyJBLEYOeBRsDcsEoSSqqphKLTm.png" alt="Plataforma de cursos Lawgic" className="w-full h-auto rounded-[12px]" />
                    </div>
                    <div className="w-full md:w-1/2 text-left space-y-3">
                      <div className="mb-4">
                        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20lawgic-UE4bOsHYCewlb7PYUlKjy6IJD9jdbg.png" alt="Lawgic Logo" className="h-10" />
                      </div>
                      <h3 className="text-xl font-bold text-[#0B0F1A]">Más de 200 cursos de derecho mexicano</h3>
                      <p className="text-[#7C86A4] leading-[1.7]">Accede a contenido especializado y actualizado constantemente para mantenerte al día con las últimas actualizaciones legales.</p>
                    </div>
                  </div>
                </div>

                {/* Legal Track Card */}
                <div className="bg-white border border-[#E9EEF5] rounded-[16px] p-6 transition-all duration-200 hover:border-[#DDE8FD] hover:shadow-[0_8px_24px_rgba(16,24,40,0.08)]" style={{ boxShadow: '0 1px 2px rgba(16,24,40,0.06)' }}>
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/2">
                      <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-04%20at%209.51.10%E2%80%AFAM-u6DEsaY2rFZ4t43BHpw2YQBVnjwoEz.png" alt="Legal Track Dashboard" className="w-full h-auto rounded-[12px]" />
                    </div>
                    <div className="w-full md:w-1/2 text-left space-y-3">
                      <div className="mb-4">
                        <div className="flex items-center gap-2">
                          <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Legaltrack-9bWIBm28SZ7IQ0DVzAj1pXzWjCKfOs.png" alt="Legal Track Logo" className="h-10" />
                          <span className="text-[#7C86A4]">Legal Track</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-[#0B0F1A]">Herramienta de IA legal</h3>
                      <p className="text-[#7C86A4] leading-[1.7]">Gestiona tu despacho de manera inteligente con nuestra IA especializada en procesos legales y seguimiento de casos.</p>
                    </div>
                  </div>
                </div>

                {/* Legal AI Quote Card */}
                <div className="bg-white border border-[#E9EEF5] rounded-[16px] p-6 transition-all duration-200 hover:border-[#DDE8FD] hover:shadow-[0_8px_24px_rgba(16,24,40,0.08)]" style={{ boxShadow: '0 1px 2px rgba(16,24,40,0.06)' }}>
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/2">
                      <CaseDetailsAnimation />
                    </div>
                    <div className="w-full md:w-1/2 text-left space-y-4">
                      <div className="mb-4">
                        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20iaquote-tqPMRrgbnkZhPAhI98N3aTCq6j1SqR.png" alt="AI Quote Logo" className="h-12" />
                      </div>
                      <h3 className="text-xl font-bold text-[#0B0F1A]">Legal AI Quote</h3>
                      <p className="text-[#7C86A4] leading-[1.7]">Sistema de cotización automatizado que reduce el tiempo de generación de propuestas de 30 minutos a solo 3 minutos.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button — pill, Primary-600, shadow-md */}
              <div className="w-full max-w-md pt-4">
                <button
                  className="w-full h-14 px-8 bg-[#3C65E2] hover:bg-[#4056BE] text-white rounded-full font-semibold text-lg transition-all duration-200 hover:-translate-y-[1px] inline-flex items-center justify-center gap-2"
                  style={{ boxShadow: '0 8px 24px rgba(16,24,40,0.08)' }}
                  onClick={() => setShowSignInDialog(true)}
                >
                  Empieza Ahora
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {showSignInDialog && (
            <SignInModal onClose={() => setShowSignInDialog(false)} />
          )}
        </section>
      </main>

      {/* Footer — clean, border top, text-600 */}
      <footer className="w-full py-8 bg-white border-t border-[#E9EEF5]">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
            <p className="text-sm text-[#7C86A4]">© {new Date().getFullYear()} Legal AI Quote. Todos los derechos reservados.</p>
            <nav className="flex gap-6" aria-label="Enlaces legales">
              <Link className="text-sm text-[#7C86A4] hover:text-[#3C65E2] transition-colors" href="/terminos">
                Términos de Servicio
              </Link>
              <Link className="text-sm text-[#7C86A4] hover:text-[#3C65E2] transition-colors" href="/privacidad">
                Privacidad
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
