"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { useAuth } from "@/lib/hooks/useAuth"
import { db } from "@/lib/firebase/firebase"
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore"
import { Plus, Trash2 } from "lucide-react"

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

interface RequirementItem {
  id: string
  text: string
  category: string
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

  // Estados para lista de requerimientos
  const [requirements, setRequirements] = useState<RequirementItem[]>([])
  const [newRequirement, setNewRequirement] = useState("")
  const [newRequirementCategory, setNewRequirementCategory] = useState("General")
  const [showRequirementsModal, setShowRequirementsModal] = useState(false)
  const [isRequirementsLoading, setIsRequirementsLoading] = useState(true)

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

  // Cargar lista de requerimientos desde Firebase
  useEffect(() => {
    if (!user?.uid) { 
      setIsRequirementsLoading(false)
      return
    }
    const unsubscribe = onSnapshot(doc(db, 'ListaRequerimientos', user.uid), snap => {
      if (snap.exists()) {
        const data = snap.data()
        setRequirements(data.requirements || [])
      }
      setIsRequirementsLoading(false)
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

  // Funciones para lista de requerimientos
  const addRequirement = async () => {
    if (!newRequirement.trim() || !user?.uid) return
    
    const newReq: RequirementItem = {
      id: Date.now().toString(),
      text: newRequirement.trim(),
      category: newRequirementCategory
    }
    
    const updatedRequirements = [...requirements, newReq]
    setRequirements(updatedRequirements)
    
    await setDoc(doc(db, 'ListaRequerimientos', user.uid), {
      requirements: updatedRequirements,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    
    setNewRequirement("")
    setNewRequirementCategory("General")
  }

  const removeRequirement = async (id: string) => {
    if (!user?.uid) return
    
    const updatedRequirements = requirements.filter(req => req.id !== id)
    setRequirements(updatedRequirements)
    
    await setDoc(doc(db, 'ListaRequerimientos', user.uid), {
      requirements: updatedRequirements,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }

  const insertRequirementsList = () => {
    if (requirements.length === 0) return
    
    const categorizedReqs: { [key: string]: string[] } = {}
    requirements.forEach(req => {
      if (!categorizedReqs[req.category]) {
        categorizedReqs[req.category] = []
      }
      categorizedReqs[req.category].push(req.text)
    })
    
    let reqText = "\n\nANEXO - LISTA DE REQUERIMIENTOS:\n\n"
    Object.keys(categorizedReqs).forEach(category => {
      reqText += `${category.toUpperCase()}:\n`
      categorizedReqs[category].forEach((text, index) => {
        reqText += `${index + 1}. ${text}\n`
      })
      reqText += "\n"
    })
    
    onInsert?.(reqText)
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

      {/* Nueva sección de Anexo Lista de requerimientos */}
      <div className="bg-white border rounded p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Anexo Lista de requerimientos</h4>
          <button 
            onClick={() => setShowRequirementsModal(true)} 
            className="p-1 text-gray-400 hover:text-gray-600" 
            title="Administrar requerimientos"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {isRequirementsLoading ? (
          <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4" />
        ) : requirements.length === 0 ? (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500 mb-2">No hay requerimientos configurados</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowRequirementsModal(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Agregar requerimientos
            </Button>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <div className="max-h-32 overflow-y-auto space-y-1">
              {requirements.map((req) => (
                <div key={req.id} className="flex items-start justify-between bg-gray-50 p-2 rounded text-xs">
                  <div className="flex-1">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium mb-1">
                      {req.category}
                    </span>
                    <p className="text-gray-900">{req.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={insertRequirementsList}
              className="w-full"
            >
              Insertar lista completa
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

      {/* Modal de requerimientos */}
      {showRequirementsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lista de Requerimientos</h3>
              <button 
                onClick={() => setShowRequirementsModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Formulario para agregar nuevo requerimiento */}
            <div className="space-y-3 mb-6 p-3 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select 
                  value={newRequirementCategory} 
                  onChange={e => setNewRequirementCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 text-sm"
                >
                  <option value="General">General</option>
                  <option value="Documentos">Documentos</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Legal">Legal</option>
                  <option value="Financiero">Financiero</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requerimiento</label>
                <textarea 
                  value={newRequirement} 
                  onChange={e => setNewRequirement(e.target.value)}
                  placeholder="Describe el requerimiento..."
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 text-sm" 
                  rows={2}
                />
              </div>
              <Button 
                onClick={addRequirement}
                disabled={!newRequirement.trim()}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar Requerimiento
              </Button>
            </div>

            {/* Lista de requerimientos existentes */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">Requerimientos Guardados ({requirements.length})</h4>
              {requirements.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No hay requerimientos agregados</p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {requirements.map((req) => (
                    <div key={req.id} className="flex items-start justify-between bg-white border rounded p-3">
                      <div className="flex-1">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium mb-1">
                          {req.category}
                        </span>
                        <p className="text-sm text-gray-900">{req.text}</p>
                      </div>
                      <button 
                        onClick={() => removeRequirement(req.id)}
                        className="ml-2 p-1 text-red-400 hover:text-red-600"
                        title="Eliminar requerimiento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 mt-4 border-t">
              <button 
                type="button" 
                onClick={() => setShowRequirementsModal(false)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cerrar
              </button>
              {requirements.length > 0 && (
                <button 
                  onClick={() => {
                    insertRequirementsList()
                    setShowRequirementsModal(false)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Insertar en texto
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
