"use client"

import { useState, useEffect } from "react"
import { Bot, FileText, Send, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function CaseDetailsAnimation() {
  const [step, setStep] = useState(0)
  const [showTyping, setShowTyping] = useState(false)

  const messages = [
    "Caso: Disputa contractual comercial",
    "Jurisdicción: CDMX",
    "Complejidad: Media",
    "Tiempo estimado: 3-6 meses",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (step === 2) {
      setShowTyping(true)
      const timer = setTimeout(() => setShowTyping(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [step])

  return (
    <div className="relative w-full max-w-[32rem] mx-auto">
      {/* Efecto de brillo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-75 animate-pulse transition duration-1000" />

      {/* Tarjeta principal */}
      <div className="relative w-full bg-blue-600/95 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20 overflow-hidden">
        <div className="p-8 space-y-6">
          {/* Indicador de estado */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_0_rgba(34,197,94,0.6)] animate-pulse" />
            <span className="text-sm font-medium text-white">IA Procesando</span>
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-start space-x-5"
                key="input"
              >
                <div className="min-w-12 h-12 rounded-xl bg-blue-500/30 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-base font-semibold text-white">Detalles del Caso</p>
                  <div className="space-y-3">
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.2 }}
                        className="text-[15px] text-white font-medium"
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-start space-x-5"
                key="processing"
              >
                <div className="min-w-12 h-12 rounded-xl bg-blue-500/30 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold mb-4 text-white">Análisis de IA</p>
                  <div className="space-y-3">
                    <div className="h-2.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2 }}
                      />
                    </div>
                    <div className="text-sm text-white/90 font-medium">Procesando datos...</div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-start space-x-5"
                key="thinking"
              >
                <div className="min-w-12 h-12 rounded-xl bg-blue-500/30 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_0_rgba(74,222,128,0.6)]" />
                    <p className="text-base font-medium text-white">IA Procesando</p>
                  </div>
                  <p className="text-lg font-semibold mb-3 text-white">Generando Cotización</p>
                  <div className="flex space-x-2">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-2.5 h-2.5 bg-blue-400 rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Number.POSITIVE_INFINITY,
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-start space-x-5"
                key="result"
              >
                <div className="min-w-12 h-12 rounded-xl bg-blue-500/30 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Send className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-base font-semibold text-white">Cotización Lista</p>
                  <div className="p-6 bg-blue-500/30 rounded-xl border border-white/20 backdrop-blur-md">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[15px] text-white/80 min-w-[140px]">Honorarios Base</span>
                        <span className="text-[15px] font-semibold text-white">$3,500</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[15px] text-white/80 min-w-[140px]">Gastos Estimados</span>
                        <span className="text-[15px] font-semibold text-white">$500</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[15px] text-white/80 min-w-[140px]">Tiempo Estimado</span>
                        <span className="text-[15px] font-semibold text-white">4 meses</span>
                      </div>
                      <div className="pt-4 border-t border-white/20">
                        <div className="flex justify-between items-center">
                          <span className="text-[15px] font-semibold text-white min-w-[140px]">Total</span>
                          <span className="text-[15px] font-semibold text-white">$4,000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 