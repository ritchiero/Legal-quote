"use client";

import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { useState } from "react";

interface PaymentAIModalProps {
  isOpen: boolean;
  loading: boolean;
  options: string[];
  onClose: () => void;
  onSelect: (option: string) => void;
}

export default function PaymentAIModal({
  isOpen,
  loading,
  options,
  onClose,
  onSelect,
}: PaymentAIModalProps) {
  const [selected, setSelected] = useState("");

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      setSelected("");
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-xl p-6 bg-white shadow-xl max-w-[90%] sm:max-w-md">
        <DialogTitle className="text-lg font-semibold mb-4">
          Sugerencias de Forma de Pago
        </DialogTitle>
        {loading ? (
          <p className="text-sm text-gray-500">Generando sugerencias...</p>
        ) : (
          <RadioGroup value={selected} onValueChange={setSelected} className="space-y-2 mb-4">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`pay-opt-${idx}`} />
                <label htmlFor={`pay-opt-${idx}`} className="text-sm cursor-pointer">
                  {opt}
                </label>
              </div>
            ))}
          </RadioGroup>
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
            disabled={!selected}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Agregar seleccionado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
