"use client"

import { useState, useEffect } from "react"
import { Bot, FileText, Send, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const QuoteAnimation = () => {
  const [step, setStep] = useState(0)
  const [showTyping, setShowTyping] = useState(false)
  const [text, setText] = useState("")

  const messages = [
    "Caso: Disputa contractual comercial",
    "Jurisdicción: Ciudad de México",
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
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-gray-500">IA Procesando</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-start space-x-4"
              key="input"
            >
              <div className="min-w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">Detalles del Caso</p>
                <div className="space-y-2">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.2 }}
                      className="text-sm text-gray-600"
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
              className="flex items-start space-x-4"
              key="processing"
            >
              <div className="min-w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Bot className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Análisis de IA</p>
                <div className="space-y-2">
                  <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-purple-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2 }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">Procesando datos...</div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-start space-x-4"
              key="thinking"
            >
              <div className="min-w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Generando Cotización</p>
                <div className="flex space-x-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-start space-x-4"
              key="result"
            >
              <div className="min-w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">Cotización Lista</p>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Honorarios Base</span>
                      <span className="text-sm font-medium">€3,500</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Gastos Estimados</span>
                      <span className="text-sm font-medium">€500</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tiempo Estimado</span>
                      <span className="text-sm font-medium">4 meses</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Total</span>
                        <span className="text-sm font-medium text-gray-900">€4,000</span>
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
  )
}

export default QuoteAnimation;

