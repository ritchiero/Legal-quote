"use client"

import { useState, useEffect, useCallback } from "react"
import { Bot, FileText, Send, Sparkles } from "lucide-react"

export default function CaseDetailsAnimation() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)

  const messages = [
    "Caso: Disputa contractual comercial",
    "Jurisdicción: CDMX",
    "Complejidad: Media",
    "Tiempo estimado: 3-6 meses",
  ]

  const cycleStep = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      setStep((prev) => (prev + 1) % 4)
      setVisible(true)
    }, 400)
  }, [])

  useEffect(() => {
    const interval = setInterval(cycleStep, 3000)
    return () => clearInterval(interval)
  }, [cycleStep])

  const iconStyle = {
    background: 'rgba(60,101,226,0.2)',
    border: '1px solid rgba(60,101,226,0.35)',
  }

  return (
    <div className="relative w-full max-w-[28rem] mx-auto">
      {/* Glow sutil */}
      <div
        className="absolute -inset-3 rounded-[28px] opacity-40 blur-2xl"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(60,101,226,0.4) 0%, transparent 70%)',
        }}
      />

      {/* Card — glass sobre navy */}
      <div
        className="relative w-full rounded-[24px]"
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="p-7 space-y-5">
          {/* Status */}
          <div className="flex items-center space-x-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
            <span className="text-[13px] font-medium text-white/70 tracking-wide">
              IA Procesando
            </span>
          </div>

          {/* Animated content — CSS transitions */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0px)' : 'translateY(12px)',
              transition: 'opacity 400ms ease-out, transform 400ms ease-out',
            }}
          >
            {step === 0 && (
              <div className="flex items-start space-x-4">
                <div
                  className="min-w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={iconStyle}
                >
                  <FileText className="h-5 w-5 text-[#93B4FC]" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-[15px] font-semibold text-white">
                    Detalles del Caso
                  </p>
                  <div className="space-y-2">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className="text-[13px] text-white/70 leading-relaxed"
                      >
                        {msg}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="flex items-start space-x-4">
                <div
                  className="min-w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={iconStyle}
                >
                  <Bot className="h-5 w-5 text-[#93B4FC]" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-[15px] font-semibold text-white">
                    Análisis de IA
                  </p>
                  <div className="space-y-2.5">
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, #3C65E2, #93B4FC)',
                          width: '100%',
                        }}
                      />
                    </div>
                    <p className="text-[13px] text-white/60">
                      Procesando datos...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex items-start space-x-4">
                <div
                  className="min-w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={iconStyle}
                >
                  <Sparkles className="h-5 w-5 text-[#93B4FC]" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-[15px] font-semibold text-white">
                    Generando Cotización
                  </p>
                  <div className="flex space-x-2">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-[#93B4FC] animate-pulse"
                        style={{ animationDelay: i * 200 + 'ms' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex items-start space-x-4">
                <div
                  className="min-w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={iconStyle}
                >
                  <Send className="h-5 w-5 text-[#93B4FC]" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-[15px] font-semibold text-white">
                    Cotización Lista
                  </p>
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-white/60">Honorarios Base</span>
                        <span className="text-[13px] font-semibold text-white">$3,500</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-white/60">Gastos Estimados</span>
                        <span className="text-[13px] font-semibold text-white">$500</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-white/60">Tiempo Estimado</span>
                        <span className="text-[13px] font-semibold text-white">4 meses</span>
                      </div>
                      <div
                        className="pt-3"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[14px] font-bold text-white">Total</span>
                          <span className="text-[14px] font-bold text-white">$4,000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
