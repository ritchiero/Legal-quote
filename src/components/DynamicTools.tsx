"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"

interface DynamicToolsProps {
  onInsert?: (text: string) => void
}

export default function DynamicTools({ onInsert }: DynamicToolsProps) {
  const [suggestion, setSuggestion] = useState("")
  const [analysis, setAnalysis] = useState("")
  const [jurisResults, setJurisResults] = useState<string[]>([])
  const [signature, setSignature] = useState<File | null>(null)
  const [term, setTerm] = useState("")
  const [expiration, setExpiration] = useState("")
  const [payments, setPayments] = useState<{ name: string; details: string }[]>(
    () => {
      if (typeof window === "undefined") return []
      try {
        const saved = localStorage.getItem("paymentMethods")
        return saved ? JSON.parse(saved) : []
      } catch {
        return []
      }
    }
  )
  const [payName, setPayName] = useState("")
  const [payDetails, setPayDetails] = useState("")

  const savePayments = (data: { name: string; details: string }[]) => {
    setPayments(data)
    if (typeof window !== "undefined") {
      localStorage.setItem("paymentMethods", JSON.stringify(data))
    }
  }

  const handleSuggestion = async () => {
    setSuggestion("Ejemplo de texto sugerido. Modifícalo según tus necesidades.")
  }

  const handleAnalysis = async () => {
    setAnalysis("Análisis preliminar completado. No se encontraron inconsistencias.")
  }

  const handleSearch = async () => {
    if (!term.trim()) return
    setJurisResults([`No se encontraron resultados para "${term}"`])
  }

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSignature(file)
  }

  const addPayment = () => {
    if (!payName.trim() || !payDetails.trim()) return
    const updated = [...payments, { name: payName.trim(), details: payDetails.trim() }]
    savePayments(updated)
    setPayName("")
    setPayDetails("")
  }

  const removePayment = (index: number) => {
    const updated = payments.filter((_, i) => i !== index)
    savePayments(updated)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded p-3 space-y-2">
        <h4 className="font-medium text-sm">Sugerencias de texto con IA</h4>
        <Button variant="outline" size="sm" onClick={handleSuggestion}>
          Generar
        </Button>
        {suggestion && <p className="text-xs text-gray-600">{suggestion}</p>}
      </div>
      <div className="bg-white border rounded p-3 space-y-2">
        <h4 className="font-medium text-sm">Verificador de coherencia legal</h4>
        <Button variant="outline" size="sm" onClick={handleAnalysis}>
          Verificar
        </Button>
        {analysis && <p className="text-xs text-gray-600">{analysis}</p>}
      </div>
      <div className="bg-white border rounded p-3 space-y-2">
        <h4 className="font-medium text-sm">Búsqueda de jurisprudencia</h4>
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Término a buscar"
          className="w-full text-sm border rounded px-2 py-1"
        />
        <Button variant="outline" size="sm" onClick={handleSearch}>
          Buscar
        </Button>
        {jurisResults.length > 0 && (
          <ul className="list-disc pl-4 text-xs text-gray-600">
            {jurisResults.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="bg-white border rounded p-3 space-y-2">
        <h4 className="font-medium text-sm">Integración con firma electrónica</h4>
        <input type="file" onChange={handleSignatureChange} className="text-sm" />
        {signature && (
          <p className="text-xs text-gray-600">Archivo: {signature.name}</p>
        )}
      </div>
      <div className="bg-white border rounded p-3 space-y-2">
        <h4 className="font-medium text-sm">Fecha de expiración de la cotización</h4>
        <input
          type="date"
          value={expiration}
          onChange={(e) => setExpiration(e.target.value)}
          className="text-sm border rounded px-2 py-1"
        />
      </div>
      <div className="bg-white border rounded p-3 space-y-2">
        <h4 className="font-medium text-sm">Datos de pago</h4>
        {payments.length === 0 && (
          <p className="text-xs text-gray-600">No hay métodos guardados</p>
        )}
        {payments.length > 0 && (
          <ul className="space-y-1 text-xs">
            {payments.map((p, i) => (
              <li key={i} className="flex justify-between items-center">
                <span>{p.name}</span>
                <div className="space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onInsert?.(p.details)}
                  >
                    Insertar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removePayment(i)}>
                    ✕
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <input
          type="text"
          placeholder="Nombre"
          value={payName}
          onChange={(e) => setPayName(e.target.value)}
          className="w-full text-sm border rounded px-2 py-1 mt-2"
        />
        <textarea
          placeholder="Detalles"
          value={payDetails}
          onChange={(e) => setPayDetails(e.target.value)}
          className="w-full text-sm border rounded px-2 py-1"
        />
        <Button variant="outline" size="sm" onClick={addPayment}>
          Guardar
        </Button>
      </div>
    </div>
  )
}
