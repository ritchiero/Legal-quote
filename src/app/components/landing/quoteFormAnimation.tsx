"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Textarea } from "@/app/components/ui/textarea"
import { Toggle } from "@/app/components/ui/toggle"
import { Label } from "@/app/components/ui/label"
import { InfoIcon } from "lucide-react"

const formFields = [
  {
    id: "company",
    label: "Para quién es esta cotización",
    placeholder: "Nombre y empresa",
    finalValue: "Acme Inc.",
  },
  {
    id: "sender",
    label: "Quién envía esta cotización",
    placeholder: "Cargando información...",
    finalValue: "Juan Pérez - Abogado Senior",
  },
  {
    id: "description",
    label: "Descripción breve del servicio",
    placeholder: "Describa brevemente el servicio legal requerido",
    finalValue: "Contrato de prestación de servicios profesionales",
    hasToggle: true,
  },
  {
    id: "needs",
    label: "Necesidades del cliente",
    placeholder: "¿Por qué el cliente necesita que esto se haga?",
    finalValue: "Necesitan formalizar la relación comercial con sus proveedores",
  },
  {
    id: "timeEstimate",
    label: "Estimación de tiempo",
    placeholder: "¿Cuánto tiempo tomará y si hay posibles retrasos, por qué?",
    finalValue: "2 semanas, considerando revisiones",
  },
  {
    id: "jurisdiction",
    label: "Jurisdicción",
    placeholder: "¿Dónde está sucediendo esto?",
    finalValue: "Ciudad de México",
  },
  {
    id: "requirements",
    label: "Requerimientos",
    placeholder: "Establezca cualquier necesidad para tener éxito en este proceso",
    finalValue: "Documentación corporativa actualizada",
  },
  {
    id: "payment",
    label: "Forma de pago y exhibiciones",
    placeholder: "Número de pagos, forma de pago y si hay descuento por pago completo",
    finalValue: "2 pagos: 50% inicial, 50% contra entrega",
  },
  {
    id: "cost",
    label: "Costo / Precio",
    placeholder: "¿Cuánto va a costar?",
    finalValue: "$25,000 MXN + IVA",
  },
]

export default function QuoteFormAnimation() {
  const [activeField, setActiveField] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, string>>(
    Object.fromEntries(formFields.map((field) => [field.id, ""])),
  )
  const [toggleStates, setToggleStates] = useState({
    manual: false,
    saved: false,
  })

  useEffect(() => {
    if (activeField < formFields.length) {
      setIsTyping(true)
      const currentField = formFields[activeField]
      let charIndex = 0
      const finalValue = currentField.finalValue

      const typingInterval = setInterval(() => {
        if (charIndex <= finalValue.length) {
          setFormValues((prev) => ({
            ...prev,
            [currentField.id]: finalValue.slice(0, charIndex),
          }))
          charIndex++
        } else {
          clearInterval(typingInterval)
          setIsTyping(false)
          if (activeField < formFields.length - 1) {
            setTimeout(() => {
              setActiveField((prev) => prev + 1)
            }, 500)
          }
        }
      }, 50)

      return () => clearInterval(typingInterval)
    }
  }, [activeField])

  useEffect(() => {
    const resetTimer = setTimeout(
      () => {
        setActiveField(0)
        setIsTyping(false)
        setFormValues(Object.fromEntries(formFields.map((field) => [field.id, ""])))
      },
      (formFields.length + 1) * 3000,
    )

    return () => clearTimeout(resetTimer)
  }, [])

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {formFields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative group bg-blue-50/30 rounded-2xl"
          >
            <div className="absolute -inset-0.5 bg-blue-200/50 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000" />
            <div className="relative bg-blue-100/20 backdrop-blur-sm p-6 rounded-xl border border-blue-200/50 h-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-700 flex items-center gap-2 text-sm font-medium" htmlFor={field.id}>
                    {field.label}
                    <InfoIcon className="w-4 h-4 text-blue-500/70" />
                  </Label>
                </div>

                {field.hasToggle && (
                  <div className="flex gap-2">
                    <Toggle
                      variant="outline"
                      className="bg-white/60 data-[state=on]:bg-blue-500 data-[state=on]:text-white border-blue-200/50 h-8 text-sm text-gray-700"
                      pressed={toggleStates.manual}
                    >
                      Manual
                    </Toggle>
                    <Toggle
                      variant="outline"
                      className="bg-white/60 data-[state=on]:bg-blue-500 data-[state=on]:text-white border-blue-200/50 h-8 text-sm text-gray-700"
                      pressed={toggleStates.saved}
                    >
                      Servicios Guardados
                    </Toggle>
                  </div>
                )}

                <div className="relative">
                  <Textarea
                    id={field.id}
                    placeholder={field.placeholder}
                    className="bg-white/60 border-blue-200/50 text-gray-700 placeholder:text-gray-500/70 min-h-[100px] resize-none text-sm"
                    value={formValues[field.id]}
                    readOnly
                  />
                  {index === activeField && isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                      className="absolute bottom-2 left-[calc(1rem+1px)] w-1 h-4 bg-blue-500"
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

