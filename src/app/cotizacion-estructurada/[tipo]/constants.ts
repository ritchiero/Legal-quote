// Interfaces
export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: string;
  tiempo: string;
  detalles?: string;
  incluye?: string[];
}

export interface CustomBlock {
  id: string;
  name: string;
  enabled: boolean;
  detailLevel: 'short' | 'medium' | 'long';
  order: number;
}

// Configuraciones por tipo de cotización
export const tiposConfig: Record<string, any> = {
  '1': { // Honorarios Fijos
    pricingType: 'fix',
    payment: 'Pago único por servicio específico',
    payments: 'Un solo pago al completar el servicio',
    pricing: 'Tarifa fija establecida'
  },
  '2': { // Cotización por Hora
    pricingType: 'variable',
    payment: 'Pago basado en horas trabajadas',
    payments: 'Facturación mensual según horas',
    pricing: 'Tarifa por hora multiplicada por tiempo trabajado'
  },
  '3': { // Retainer
    pricingType: 'fix',
    payment: 'Anticipo mensual fijo',
    payments: 'Pago mensual recurrente',
    pricing: 'Monto fijo mensual por disponibilidad'
  },
  '4': { // Contingencia
    pricingType: 'variable',
    payment: 'Pago basado en resultado exitoso',
    payments: 'Porcentaje del monto recuperado',
    pricing: 'Entre 20-40% del resultado obtenido'
  },
  '5': { // Proyecto
    pricingType: 'fix',
    payment: 'Precio total acordado para el proyecto',
    payments: '50% al inicio, 50% al finalizar',
    pricing: 'Precio fijo por proyecto completo'
  },
  '6': { // Iguala/Suscripción
    pricingType: 'fix',
    payment: 'Cuota mensual o anual',
    payments: 'Pago recurrente mensual/anual',
    pricing: 'Suscripción con servicios ilimitados o con límite de horas'
  }
};

export const tiposTitulos: Record<string, string> = {
  '1': 'Honorarios Fijos',
  '2': 'Cotización por Hora',
  '3': 'Retainer',
  '4': 'Contingencia',
  '5': 'Proyecto',
  '6': 'Iguala/Suscripción'
};

export const VALID_TIPOS = ['1', '2', '3', '4', '5', '6'];

export const DEFAULT_CUSTOM_BLOCKS: CustomBlock[] = [
  { id: 'intro', name: 'Introducción', enabled: true, detailLevel: 'medium', order: 0 },
  { id: 'services', name: 'Alcance de Servicios', enabled: true, detailLevel: 'medium', order: 1 },
  { id: 'process', name: 'Metodología/Proceso', enabled: true, detailLevel: 'short', order: 2 },
  { id: 'timeline', name: 'Cronograma', enabled: false, detailLevel: 'short', order: 3 },
  { id: 'costs', name: 'Costos y Forma de Pago', enabled: true, detailLevel: 'long', order: 4 },
  { id: 'terms', name: 'Términos y Condiciones', enabled: true, detailLevel: 'short', order: 5 },
  { id: 'closing', name: 'Cierre y Firma', enabled: true, detailLevel: 'short', order: 6 },
];

export const PROCESS_STEPS = [
  { id: 0, title: 'Tipo de Cobro', status: 'completed' as const },
  { id: 1, title: 'Detalles del Proyecto' },
  { id: 2, title: 'Opciones Adicionales' },
  { id: 3, title: 'Formato y Tono' },
];