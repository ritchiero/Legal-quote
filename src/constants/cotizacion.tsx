export type TipoCotizacion = "corta" | "detallada";

export interface TipoCotizacionOption {
  id: TipoCotizacion;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const tiposCotizacion: TipoCotizacionOption[] = [
  {
    id: "corta",
    label: "Cotización Corta",
    description:
      "Incluye información básica pero completa del servicio, ideal para propuestas iniciales",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 384 512"
        className="w-5 h-5"
      >
        <path
          fill="currentColor"
          d="M352 448l0-256-112 0c-26.5 0-48-21.5-48-48l0-112L64 32C46.3 32 32 46.3 32 64l0 384c0 17.7 14.3 32 32 32l256 0c17.7 0 32-14.3 32-32zm-.5-288c-.7-2.8-2.1-5.4-4.2-7.4L231.4 36.7c-2.1-2.1-4.6-3.5-7.4-4.2L224 144c0 8.8 7.2 16 16 16l111.5 0zM0 64C0 28.7 28.7 0 64 0L220.1 0c12.7 0 24.9 5.1 33.9 14.1L369.9 129.9c9 9 14.1 21.2 14.1 33.9L384 448c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 64z"
        />
      </svg>
    ),
  },
  {
    id: "detallada",
    label: "Cotización Detallada",
    description:
      "Descripción exhaustiva de todos los aspectos del servicio, ideal para propuestas formales",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 384 512"
        className="w-5 h-5"
      >
        <path
          fill="currentColor"
          d="M320 480L64 480c-17.7 0-32-14.3-32-32L32 64c0-17.7 14.3-32 32-32l128 0 0 112c0 26.5 21.5 48 48 48l112 0 0 256c0 17.7-14.3 32-32 32zM240 160c-8.8 0-16-7.2-16-16l0-111.5c2.8 .7 5.4 2.1 7.4 4.2L347.3 152.6c2.1 2.1 3.5 4.6 4.2 7.4L240 160zM64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-284.1c0-12.7-5.1-24.9-14.1-33.9L254.1 14.1c-9-9-21.2-14.1-33.9-14.1L64 0zm0 80c0 8.8 7.2 16 16 16l64 0c8.8 0 16-7.2 16-16s-7.2-16-16-16L80 64c-8.8 0-16 7.2-16 16zm0 64c0 8.8 7.2 16 16 16l64 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-64 0c-8.8 0-16 7.2-16 16zM224 432c0 8.8 7.2 16 16 16l64 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-64 0c-8.8 0-16 7.2-16 16zm64-96L96 336l0-64 192 0 0 64zM96 240c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32l192 0c17.7 0 32-14.3 32-32l0-64c0-17.7-14.3-32-32-32L96 240z"
        />
      </svg>
    ),
  },
];
import React from 'react';

export const QUOTE_TYPES = {
  basic: {
    name: "Básica",
    description: "Incluye información básica pero completa del servicio, ideal para propuestas iniciales",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 384 512"
        className="w-5 h-5 text-gray-500"
      >
        <path fill="currentColor" d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM112 256H272c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H272c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H272c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/>
      </svg>
    ),
  },
  detailed: {
    name: "Detallada",
    description: "Incluye análisis completo, cronograma detallado y términos específicos",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 384 512"
        className="w-5 h-5 text-gray-500"
      >
        <path fill="currentColor" d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM80 64h64c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64h64c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16s7.2-16 16-16zm16 96H272c8.8 0 16 7.2 16 16s-7.2 16-16 16H96c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H272c8.8 0 16 7.2 16 16s-7.2 16-16 16H96c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H272c8.8 0 16 7.2 16 16s-7.2 16-16 16H96c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/>
      </svg>
    ),
  },
};

export const DEFAULT_SERVICES = [
  {
    id: "1",
    nombre: "Registro de Marca",
    descripcion: "Servicio completo de registro de marca ante IMPI",
    tiempo: "3-4 meses",
    precio: "15000",
    incluye: ["Búsqueda de anterioridades", "Presentación de solicitud", "Seguimiento del trámite"]
  },
  {
    id: "2", 
    nombre: "Constitución de Sociedad",
    descripcion: "Constitución de sociedad anónima de capital variable",
    tiempo: "2-3 semanas",
    precio: "25000",
    incluye: ["Elaboración de estatutos", "Protocolización ante notario", "Inscripción en RPP"]
  }
];
