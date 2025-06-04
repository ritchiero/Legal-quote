"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { useAuth } from "@/lib/hooks/useAuth"
import { db } from "@/lib/firebase/firebase"
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore"
import { Plus } from "lucide-react"

interface DynamicToolsProps {
  onInsert?: (text: string) => void
}

interface ContactInfo {
  name?: string
  phone?: string
  mobile?: string
  email?: string
  web?: string
  address?: string
}

export default function DynamicTools({ onInsert }: DynamicToolsProps) {
  const { user } = useAuth()
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
  
  // Estados para contacto
  const [contact, setContact] = useState<ContactInfo>({ name: '', phone: '', mobile: '', email: '', web: '', address: '' })
  const [isContactLoading, setIsContactLoading] = useState(true)
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactFormData, setContactFormData] = useState<ContactInfo>({ name: '', phone: '', mobile: '', email: '', web: '', address: '' })

  // Cargar datos de contacto desde Firebase
  useEffect(() => {
    if (!user?.uid) { 
      setIsContactLoading(false)
      return
    }
    const unsubscribe = onSnapshot(doc(db, 'DatosContacto', user.uid), snap => {
      if (snap.exists()) {
        const data = snap.data() as ContactInfo
        setContact({
          name: data.name || '',
          phone: data.phone || '',
          mobile: data.mobile || '',
          email: data.email || '',
          web: data.web || '',
          address: data.address || ''
        })
      }
      setIsContactLoading(false)
    })
    return () => unsubscribe()
  }, [user?.uid])

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

  // Funciones para contacto
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) return
    await setDoc(doc(db, 'DatosContacto', user.uid), {
      name: contactFormData.name,
      phone: contactFormData.phone,
      mobile: contactFormData.mobile,
      email: contactFormData.email,
      web: contactFormData.web,
      address: contactFormData.address,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    setContact(contactFormData)
    setShowContactModal(false)
  }

  const insertContact = () => {
    const lines: string[] = []
    if (contact.name) lines.push(`Nombre: ${contact.name}`)
    if (contact.phone) lines.push(`Teléfono: ${contact.phone}`)
    if (contact.mobile) lines.push(`Móvil: ${contact.mobile}`)
    if (contact.email) lines.push(`Email: ${contact.email}`)
    if (contact.web) lines.push(`Web: ${contact.web}`)
    if (contact.address) lines.push(`Domicilio: ${contact.address}`)
    const contactText = `\n\nContacto:\n${lines.join('\n')}`
    onInsert?.(contactText)
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

      {/* Nueva sección de Datos de Contacto */}
      <div className="bg-white border rounded p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Datos de contacto</h4>
          <button 
            onClick={() => { 
              setShowContactModal(true)
              setContactFormData(contact) 
            }} 
            className="p-1 text-gray-400 hover:text-gray-600" 
            title="Editar datos"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {isContactLoading ? (
          <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4" />
        ) : !(contact.name || contact.phone || contact.mobile || contact.email || contact.web || contact.address) ? (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500 mb-2">No hay datos configurados</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowContactModal(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Configurar contacto
            </Button>
          </div>
        ) : (
          <div className="space-y-1 text-xs">
            {contact.name && <p className="text-gray-900">👤 {contact.name}</p>}
            {contact.phone && <p className="text-gray-900">☎️ {contact.phone}</p>}
            {contact.mobile && <p className="text-gray-900">📱 {contact.mobile}</p>}
            {contact.email && <p className="text-gray-900">📧 {contact.email}</p>}
            {contact.web && <p className="text-gray-900">🌐 {contact.web}</p>}
            {contact.address && <p className="text-gray-900">🏠 {contact.address}</p>}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={insertContact}
              className="mt-2 w-full"
            >
              Insertar en texto
            </Button>
          </div>
        )}
      </div>

      {/* Modal de contacto */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-sm w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Configurar Contacto</h3>
              <button 
                onClick={() => setShowContactModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={contactFormData.name || ''} 
                  onChange={e => setContactFormData({ ...contactFormData, name: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input 
                  type="text" 
                  value={contactFormData.phone || ''} 
                  onChange={e => setContactFormData({ ...contactFormData, phone: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Móvil</label>
                <input 
                  type="text" 
                  value={contactFormData.mobile || ''} 
                  onChange={e => setContactFormData({ ...contactFormData, mobile: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={contactFormData.email || ''} 
                  onChange={e => setContactFormData({ ...contactFormData, email: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                <input 
                  type="text" 
                  value={contactFormData.web || ''} 
                  onChange={e => setContactFormData({ ...contactFormData, web: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domicilio</label>
                <textarea 
                  value={contactFormData.address || ''} 
                  onChange={e => setContactFormData({ ...contactFormData, address: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-lg text-gray-900" 
                  rows={2} 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowContactModal(false)} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
