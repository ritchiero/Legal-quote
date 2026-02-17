"use client"

import { useState, useEffect } from "react"
import { Bot, FileText, Send, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function CaseDetailsAnimation() {
  const [step, setStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  const messages = [
    "Caso: Disputa contractual comercial",
    "Jurisdicción: CDMX",
    "Complejidad: Media",
    "Tiempo estimado: 3-6 meses",
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4)
    }, 3000)

    return () => clearInterval(interval)
  }, [mounted])

  return (
    <div className="relative w-full max-w-[28rem] mx-auto">
      {/* Glow sutil */}
      <div
        className="absolute -inset-3 rounded-[28px] opacity-40 blur-2xl"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(60,101,226,0.4) 0%, transparent 70%)',
        }}
      />

      {/* Card principal — glass elegante sobre navy */}
      <div
        className="relative w-full rounded-[24px] overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="p-7 space-y-5">
          {/* Status indicator */}
          <div className="flex items-center space-x-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
            <span className="text-[13px] font-medium text-white/70 tracking-wide">
              IA Procesando
            </span>
          </div>

          {mounted && (
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex items-start space-x-4"
                  key="input"
                >
                  <div
                    className="min-w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(60,101,226,0.2)',
                      border: '1px solid rgba(60,101,226,0.35)',
                    }}
                  >
                    <FileText className="h-5 w-5 text-[#93B4FC]" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-[15px] font-semibold text-white">
                      Detalles del Caso
                    </p>
                    <div className="space-y-2">
                      {messages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.15, duration: 0.3 }}
                          className="text-[13px] text-white/70 leading-relaxed"
                        >
                          {msg}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex items-start space-x-4"
                  key="processing"
                >
                  <div
                    className="min-w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(60,101,226,0.2)',
                      border: '1px solid rgba(60,101,226,0.35)',
                    }}
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
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: 'linear-gradient(90deg, #3C65E2, #93B4FC)',
                          }}
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2, ease: "easeInOut" }}
                        />
                      </div>
                      <p className="text-[13px] text-white/60">
                        Procesando datos...
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex items-start space-x-4"
                  key="thinking"
                >
                  <div
                    className="min-w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(60,101,226,0.2)',
                      border: '1px solid rgba(60,101,226,0.35)',
                    }}
                  >
                    <Sparkles className="h-5 w-5 text-[#93B4FC]" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-[15px] font-semibold text-white">
                      Generando Cotización
                    </p>
                    <div className="flex space-x-2">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 rounded-full bg-[#93B4FC]"
                          animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.4, 1, 0.4],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex items-start space-x-4"
                  key="result"
                >
                  <div
                    className="min-w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(60,101,226,0.2)',
                      border: '1px solid rgba(60,101,226,0.35)',
                    }}
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
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
