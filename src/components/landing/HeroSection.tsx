"use client"

import { ArrowRight } from "lucide-react"
import BackgroundPattern from "./backgroundPattern"
import CaseDetailsAnimation from "./CaseDetailsAnimation"
import LogoSection from "./LogoSection"
import { useState } from "react"
import SignInModal from "@/components/SignInModal"

export default function HeroSection() {
    const [showSignInDialog, setShowSignInDialog] = useState(false)

  return (
        <section
                id="hero"
                aria-label="Hero"
                className="relative w-full min-h-screen flex items-center pt-16 md:pt-2 pb-20 overflow-hidden scroll-mt-20"
              >
              <BackgroundPattern />
        
              <div className="container px-6 md:px-6 lg:px-8 xl:pl-[300px] relative z-10 overflow-x-hidden">
                      <div className="grid gap-8 lg:gap-12 md:grid-cols-[1fr_400px] items-center">
                                <div className="flex flex-col justify-center space-y-8">
                                            <LogoSection />
                                
                                            <div className="space-y-4">
                                              {/* H1 Hero: 52-60px / 800 / 1.08 / tracking -0.03em */}
                                                          <h1 className="text-3xl sm:text-4xl md:text-[52px] lg:text-[60px] font-extrabold tracking-[-0.03em] text-white leading-[1.08]">
                                                                          <span className="block">¿Odias Hacer Cotizaciones?</span>span>{" "}
                                                            {/* Gradient A — solo 1 frase premium por vista */}
                                                                          <span
                                                                                              className="block mt-2"
                                                                                              style={{
                                                                                                                    background: 'linear-gradient(90deg, #3860D8 0%, #A818F0 55%, #F06838 100%)',
                                                                                                                    WebkitBackgroundClip: 'text',
                                                                                                                    WebkitTextFillColor: 'transparent',
                                                                                                                    backgroundClip: 'text',
                                                                                                }}
                                                                                            >
                                                                                            Nosotros También
                                                                          </span>span>
                                                          </h1>h1>
                                              {/* Body: 15-16px / 400-500 / 1.7 — white at 70-100% on dark */}
                                                          <p className="text-base md:text-lg lg:text-xl text-white/80 max-w-[600px] leading-[1.7]">
                                                                          Por eso creamos una solución que reduce el tiempo de cotización{" "}
                                                                          <span className="line-through text-white/50">de 30 minutos</span>span>{" "}
                                                                          <span className="text-white font-semibold">a solo 3 minutos</span>span>
                                                          </p>p>
                                            </div>div>
                                
                                  {/* CTA: pill (9999px), Primary-600, shadow-md */}
                                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                                          <button
                                                                            className="inline-flex items-center justify-center gap-2 bg-[#3C65E2] hover:bg-[#4056BE] text-white font-semibold text-base sm:text-lg px-8 py-4 rounded-full transition-all duration-200 hover:-translate-y-[1px] min-w-[200px]"
                                                                            style={{ boxShadow: '0 8px 24px rgba(16,24,40,0.08)' }}
                                                                            onClick={() => setShowSignInDialog(true)}
                                                                          >
                                                                          Empieza Ahora
                                                                          <ArrowRight className="h-5 w-5" />
                                                          </button>button>
                                            </div>div>
                                </div>div>
                      
                                <div className="hidden md:flex items-center justify-center relative z-10 max-w-full">
                                            <div className="transform hover:scale-[1.02] transition-transform duration-300">
                                                          <CaseDetailsAnimation />
                                            </div>div>
                                </div>div>
                      </div>div>
              </div>div>
        
          {showSignInDialog && (
                        <SignInModal onClose={() => setShowSignInDialog(false)} />
                      )}
        </section>section>
      )
}</section>
