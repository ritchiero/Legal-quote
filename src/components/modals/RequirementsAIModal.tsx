"use client";

import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useState } from "react";

interface RequirementsAIModalProps {
  isOpen: boolean;
  loading: boolean;
  options: string[];
  onClose: () => void;
  onSelect: (options: string[]) => void;
  customTitle?: string;
}

export default function RequirementsAIModal({
  isOpen,
  loading,
  options,
  onClose,
  onSelect,
  customTitle,
}: RequirementsAIModalProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (opt: string) => {
    setSelected((prev) =>
      prev.includes(opt)
        ? prev.filter((o) => o !== opt)
        : [...prev, opt]
    );
  };

  const handleConfirm = () => {
    onSelect(selected);
    setSelected([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-xl p-6 bg-white shadow-xl max-w-[90%] sm:max-w-md">
        <DialogTitle className="text-lg font-semibold mb-4">
          {customTitle || 'Sugerencias de Requerimientos'}
        </DialogTitle>
        {loading ? (
          <p className="text-sm text-gray-500">Generando sugerencias...</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {options.map((opt, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Checkbox
                  checked={selected.includes(opt)}
                  onCheckedChange={() => toggleOption(opt)}
                  id={`req-opt-${idx}`}
                />
                <label htmlFor={`req-opt-${idx}`} className="text-sm cursor-pointer">
                  {opt}
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            aria-label="Cerrar"
            onClick={onClose}
            className="text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
          >
            Cerrar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Agregar seleccionados
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
