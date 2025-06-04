"use client"

import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog"
import { Textarea } from "@/app/components/ui/textarea"
import { Button } from "@/app/components/ui/button"
import { SparklesIcon } from "@heroicons/react/24/outline"

interface CreateServiceModalProps {
  isOpen: boolean
  aiPrompt: string
  onPromptChange: (value: string) => void
  loading: boolean
  error?: string | null
  onClose: () => void
  onGenerate: () => void
}

export default function CreateServiceModal({
  isOpen,
  aiPrompt,
  onPromptChange,
  loading,
  error,
  onClose,
  onGenerate,
}: CreateServiceModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-xl p-6 bg-white shadow-xl max-w-[90%] sm:max-w-md">
        <DialogTitle className="text-lg font-semibold mb-1">
          Crear Servicio con IA
        </DialogTitle>
        <p className="text-sm text-gray-600 mb-4">
          Describe en una frase el servicio que necesitas y la IA completará los detalles.
        </p>
        <Textarea
          aria-label="Descripción del servicio"
          placeholder="Ej.: Asesoría legal integral para startups"
          rows={3}
          value={aiPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className="w-full resize-none mb-2"
          disabled={loading}
        />
        <ul className="list-disc list-inside text-xs text-gray-500 space-y-1 mb-6">
          <li>Nombre y descripción</li>
        </ul>
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        {loading && (
          <div className="space-y-2 mb-4">
            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-progress"></div>
            </div>
            <p className="text-sm text-gray-500 text-center">Generando servicio con IA...</p>
          </div>
        )}
        <div className="flex justify-between items-center">
          <Button variant="ghost" aria-label="Cancelar" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="default"
            aria-label="Generar con IA"
            onClick={onGenerate}
            disabled={loading || !aiPrompt.trim()}
          >
            <SparklesIcon className="h-4 w-4" />
            Generar con IA
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
