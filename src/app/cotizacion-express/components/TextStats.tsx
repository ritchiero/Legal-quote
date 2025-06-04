import React from 'react';
import { TipoCotizacion } from '@/constants/cotizacion';

export interface TextStatsProps {
  content: string;
  tipoCotizacion: TipoCotizacion;
}

const TextStats = ({ content, tipoCotizacion }: TextStatsProps) => {
  const secciones = content.split(/\n{2,}/);
  const stats = secciones.map(seccion => seccion.split(/\s+/).length);
  const total = stats.reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`${
        total < 250 || total > 350 ? 'text-amber-500' : 'text-green-500'
      }`}>
        {total} palabras
      </span>
      <span className="text-gray-300">•</span>
      <span className="text-gray-500">
        {content.length} caracteres
      </span>
      {tipoCotizacion === 'corta' && (
        <span className="text-gray-400">
          (Recomendado: 250-350 palabras)
        </span>
      )}
    </div>
  );
};

export default TextStats;
