'use client';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface MarketAITabProps {
  userId: string;
}

interface TipoCobro {
  nombre: string;
  descripcion: string;
  rangoPrecios: string;
  frecuencia: 'común' | 'ocasional' | 'raro';
}

interface FuenteOficial {
  nombre: string;
  url: string;
  descripcion?: string;
}

interface CostoGubernamental {
  concepto: string;
  monto: string;
  fuente?: {
    nombre: string;
    url: string;
    fechaActualizacion: string;
  };
}

interface EstimateResponse {
  refinedQuery: string;
  html: string;
  tiposCobro: TipoCobro[];
  costosGubernamentales: CostoGubernamental[];
  rangosHonorarios: {
    minimo: string;
    promedio: string;
    maximo: string;
  };
  factores: string[];
  fuentesOficiales: FuenteOficial[];
}

type AnalysisStep = 'idle' | 'refining' | 'analyzing' | 'complete';

// Componente para el botón de consulta
const ConsultButton = ({ isLoading, step }: { isLoading: boolean; step: AnalysisStep }) => {
  const getMessage = () => {
    switch (step) {
      case 'refining':
        return 'Refinando tu consulta...';
      case 'analyzing':
        return 'Analizando el mercado...';
      default:
        return 'Consultar IA';
    }
  };

  return (
    <button
      type="submit"
      disabled={isLoading}
      className="inline-flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          {getMessage()}
        </>
      ) : (
        <>
          <ConsultIcon />
          Consultar IA
        </>
      )}
    </button>
  );
};

// Componente para el spinner de carga
const LoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
    />
  </svg>
);

// Componente para el icono de consulta
const ConsultIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const RefinedQueryDisplay = ({ query }: { query: string }) => (
  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-2xl p-6 mb-6 border border-blue-100 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <div className="bg-blue-100 rounded-full p-1.5">
        <svg 
          className="w-4 h-4 text-blue-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
          />
        </svg>
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-900">Consulta Refinada por IA</h3>
        <p className="text-xs text-gray-600">Análisis detallado del mercado legal</p>
      </div>
    </div>
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
      <p className="text-sm text-blue-800 leading-relaxed">{query}</p>
    </div>
  </div>
);

// Mover la función fuera de los componentes
const getFrequencyStyles = (freq: string) => {
  switch (freq.toLowerCase()) {
    case 'muy común':
      return {
        container: 'bg-emerald-50 border-emerald-200',
        dot: 'bg-emerald-400',
        text: 'text-emerald-700',
        label: 'Muy común'
      };
    case 'común':
      return {
        container: 'bg-blue-50 border-blue-200',
        dot: 'bg-blue-400',
        text: 'text-blue-700',
        label: 'Común'
      };
    case 'ocasional':
      return {
        container: 'bg-yellow-50 border-yellow-200',
        dot: 'bg-yellow-400',
        text: 'text-yellow-700',
        label: 'Ocasional'
      };
    case 'poco común':
      return {
        container: 'bg-orange-50 border-orange-200',
        dot: 'bg-orange-400',
        text: 'text-orange-700',
        label: 'Poco común'
      };
    default:
      return {
        container: 'bg-gray-50 border-gray-200',
        dot: 'bg-gray-400',
        text: 'text-gray-700',
        label: 'Raro'
      };
  }
};

const FrequencyBadge = ({ frequency }: { frequency: string }) => {
  const styles = getFrequencyStyles(frequency);
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
      'text-[10px] font-medium border',
      styles.container,
      styles.text
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
      {styles.label}
    </span>
  );
};

const TiposCobroSection = ({ tiposCobro }: { tiposCobro: TipoCobro[] }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6 hover:border-blue-200 transition-colors">
    <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Tipos de Cobro Usuales
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tiposCobro.map((tipo) => (
        <div 
          key={tipo.nombre} 
          className={cn(
            "bg-white rounded-xl p-4 shadow-sm transition-all duration-200",
            "hover:shadow-md hover:scale-[1.02] cursor-default",
            "border-l-4",
            tipo.frecuencia === 'común' && 'border-blue-500 hover:border-blue-600',
            tipo.frecuencia === 'ocasional' && 'border-yellow-500 hover:border-yellow-600',
            tipo.frecuencia === 'raro' && 'border-gray-500 hover:border-gray-600'
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <h5 className="text-sm font-semibold text-gray-900">{tipo.nombre}</h5>
            <span className={cn(
              "text-xs px-2 py-1 rounded-full",
              tipo.frecuencia === 'común' && 'bg-blue-100 text-blue-700',
              tipo.frecuencia === 'ocasional' && 'bg-yellow-100 text-yellow-700',
              tipo.frecuencia === 'raro' && 'bg-gray-100 text-gray-700'
            )}>
              {tipo.frecuencia}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">{tipo.descripcion}</p>
          <p className="text-sm font-medium text-blue-600">{tipo.rangoPrecios}</p>
        </div>
      ))}
    </div>
  </div>
);

const AnalysisSection = ({ title, children, icon }: { 
  title: string; 
  children: React.ReactNode;
  icon: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="border-b border-gray-100 p-4">
      <div className="flex items-center gap-2">
        <div className="bg-blue-50 rounded-full p-1.5">
          {icon}
        </div>
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

const PriceRange = ({ label, amount, color }: { 
  label: string; 
  amount: string;
  color: 'blue' | 'emerald' | 'indigo';
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    indigo: 'bg-indigo-100 border-indigo-200 text-indigo-900'
  };

  return (
    <div className={cn(
      'rounded-lg p-3 border',
      colorClasses[color]
    )}>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-base font-semibold">{amount}</p>
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
    <span className="text-xs text-gray-600">{label}</span>
    <span className="text-xs font-medium text-gray-900">{value}</span>
  </div>
);

const OfficialSourceLink = ({ url, name }: { url: string; name: string }) => (
  <a 
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 transition-colors"
  >
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
    {name}
  </a>
);

const CostosGubernamentalesSection = ({ 
  costos,
  fuentes = []
}: { 
  costos: CostoGubernamental[];
  fuentes?: FuenteOficial[];
}) => (
  <AnalysisSection 
    title="Costos Gubernamentales"
    icon={<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>}
  >
    <div className="space-y-4">
      <div className="space-y-2">
        {costos.map((costo) => (
          <div key={costo.concepto} className="flex flex-col space-y-1">
            <DetailItem 
              label={costo.concepto}
              value={costo.monto}
            />
            {costo.fuente && (
              <div className="flex items-center gap-1 pl-2">
                <OfficialSourceLink 
                  url={costo.fuente.url}
                  name={costo.fuente.nombre}
                />
                <span className="text-[9px] text-gray-400">
                  (Actualizado: {costo.fuente.fechaActualizacion})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Referencias Oficiales - Solo se muestra si hay fuentes */}
      {Array.isArray(fuentes) && fuentes.length > 0 && (
        <div className="border-t border-gray-100 pt-3 space-y-1">
          <p className="text-[10px] text-gray-500 font-medium">Fuentes Oficiales:</p>
          <div className="space-y-1">
            {fuentes.map((fuente) => (
              <div key={fuente.url} className="space-y-0.5">
                <OfficialSourceLink 
                  url={fuente.url}
                  name={fuente.nombre}
                />
                {fuente.descripcion && (
                  <p className="text-[9px] text-gray-500 pl-4">{fuente.descripcion}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer - Siempre visible */}
      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
        <p className="text-[10px] text-yellow-800 leading-relaxed">
          <span className="font-semibold">Importante:</span> Los costos gubernamentales mostrados son aproximados y pueden variar. 
          Se recomienda consultar las fuentes oficiales para obtener los montos exactos y actualizados.
        </p>
      </div>
    </div>
  </AnalysisSection>
);

const AIDisclaimer = () => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-4 space-y-3">
    <div className="flex items-start gap-2">
      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="space-y-2">
        <p className="text-xs text-gray-700 font-medium">
          Esta estimación ha sido generada por IA (Perplexity) y debe considerarse únicamente como una aproximación inicial.
        </p>
        <ul className="text-[11px] text-gray-600 space-y-1.5">
          <li className="flex items-start gap-1.5">
            <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
            La precisión de la estimación depende directamente de la especificidad de tu consulta. Cuanto más detallada sea, mejores resultados obtendrás.
          </li>
          <li className="flex items-start gap-1.5">
            <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
            Los montos y condiciones pueden variar significativamente según la jurisdicción, complejidad y circunstancias específicas.
          </li>
          <li className="flex items-start gap-1.5">
            <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
            Para algunos servicios legales específicos, la información disponible puede ser limitada o no estar actualizada.
          </li>
        </ul>
        <div className="text-[10px] text-gray-500 pt-1">
          <p className="font-medium mb-1">Recomendaciones:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Consulta múltiples fuentes oficiales</li>
            <li>Contacta directamente con profesionales legales</li>
            <li>Solicita cotizaciones detalladas</li>
            <li>Verifica la información con las autoridades correspondientes</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const AnalisisDetalladoSection = ({ html }: { html: string }) => {
  // Función para limpiar y formatear el texto
  const formatearTexto = (texto: string) => {
    return texto
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .split(/(?=<li>)|(?=<ul>)|(?=<h)/)
      .filter(Boolean);
  };

  // Función para renderizar diferentes tipos de contenido
  const renderizarContenido = (texto: string, index: number) => {
    if (texto.startsWith('<h')) {
      return (
        <h4 key={index} className="text-sm font-semibold text-gray-900 mt-4 mb-2">
          {texto.replace(/<\/?h\d>/g, '')}
        </h4>
      );
    }
    
    if (texto.startsWith('<ul>')) {
      const items = texto
        .replace(/<\/?ul>/g, '')
        .split('<li>')
        .filter(Boolean)
        .map(item => item.replace('</li>', ''));
      
      return (
        <ul key={index} className="list-disc list-inside space-y-1 mb-3">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-gray-700">
              {item}
            </li>
          ))}
        </ul>
      );
    }

    // Párrafos normales
    return (
      <p key={index} className="text-xs text-gray-700 mb-2">
        {texto}
      </p>
    );
  };

  return (
    <AnalysisSection
      title="Análisis Detallado"
      icon={<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>}
    >
      <div className="prose prose-sm max-w-none">
        <div className="space-y-1">
          {formatearTexto(html).map((texto, index) => renderizarContenido(texto, index))}
        </div>
      </div>
    </AnalysisSection>
  );
};

const EstimateDisplay = ({ estimate }: { estimate: EstimateResponse }) => {
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (estimate && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [estimate]);

  return (
    <div ref={resultRef} className="mt-6 animate-fadeIn space-y-4">
      {/* AIDisclaimer al inicio */}
      <AIDisclaimer />

      {/* Resumen Principal */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <div className="grid grid-cols-3 gap-3">
          <PriceRange 
            label="Honorarios Mínimos" 
            amount={estimate.rangosHonorarios.minimo}
            color="blue"
          />
          <PriceRange 
            label="Honorarios Promedio" 
            amount={estimate.rangosHonorarios.promedio}
            color="emerald"
          />
          <PriceRange 
            label="Honorarios Máximos" 
            amount={estimate.rangosHonorarios.maximo}
            color="indigo"
          />
        </div>
      </div>

      {/* Tipos de Cobro Usuales */}
      <AnalysisSection
        title="Tipos de Cobro Usuales"
        icon={<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {estimate.tiposCobro.map((tipo) => (
            <div 
              key={tipo.nombre}
              className={cn(
                "bg-white rounded-lg p-3 border",
                "transition-all duration-200 hover:shadow-sm",
                getFrequencyStyles(tipo.frecuencia).container
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="space-y-1">
                  <h5 className="text-xs font-semibold text-gray-900">{tipo.nombre}</h5>
                  <p className="text-[11px] text-gray-600">{tipo.descripcion}</p>
                </div>
                <FrequencyBadge frequency={tipo.frecuencia} />
              </div>
              {tipo.rangoPrecios && (
                <div className={cn(
                  'mt-2 text-[11px] font-medium rounded-md px-2 py-1',
                  getFrequencyStyles(tipo.frecuencia).container,
                  getFrequencyStyles(tipo.frecuencia).text
                )}>
                  {tipo.rangoPrecios}
                </div>
              )}
            </div>
          ))}
        </div>
      </AnalysisSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CostosGubernamentalesSection 
          costos={estimate.costosGubernamentales}
          fuentes={estimate.fuentesOficiales}
        />

        {/* Factores que Influyen */}
        <AnalysisSection
          title="Factores que Influyen"
          icon={<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>}
        >
          <ul className="space-y-2">
            {estimate.factores.map((factor) => (
              <li key={factor} className="flex items-center gap-2 text-xs text-gray-700">
                <span className="w-1 h-1 rounded-full bg-blue-400" />
                {factor}
              </li>
            ))}
          </ul>
        </AnalysisSection>
      </div>

      {/* Análisis Detallado con mejor formateo */}
      <AnalisisDetalladoSection html={estimate.html} />

      {/* Nota al pie con fuentes */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="text-[10px] text-gray-500">
          <p className="font-medium mb-1">Fuentes de información:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Análisis de IA basado en datos públicos disponibles</li>
            <li>Tarifas oficiales de instituciones gubernamentales</li>
            <li>Estadísticas del mercado legal mexicano</li>
            <li>Información pública de despachos legales</li>
          </ul>
        </div>
        <p className="text-[10px] text-gray-500 italic">
          Última actualización de datos: {new Date().toLocaleDateString('es-MX')}
        </p>
      </div>
    </div>
  );
};

export default function MarketAITab({ userId }: { userId: string }) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [step, setStep] = useState<AnalysisStep>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 10) {
      toast.error('La consulta debe tener al menos 10 caracteres');
      return;
    }

    setIsLoading(true);
    setStep('refining');

    try {

      const response = await fetch('/api/market-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }).catch(error => {
        console.error('Error en la solicitud:', error);
        throw error;
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Error en la respuesta:', {
          status: response.status,
          data: responseData
        });
        throw new Error(responseData.details || responseData.error || 'Error desconocido');
      }

      setStep('analyzing');
      setEstimate(responseData);
      setStep('complete');
    } catch (error) {
      console.error('Error completo:', error);
      toast.error(error instanceof Error ? error.message : 'Error al obtener la estimación');
      setStep('idle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mercado IA</h2>
              <p className="mt-1 text-sm text-gray-500">
                Obtén estimaciones de precios basadas en el análisis del mercado actual
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Qué servicio legal deseas cotizar?
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none disabled:opacity-50 disabled:bg-gray-50 text-gray-900"
                placeholder="Describe el servicio legal que te interesa. Por ejemplo: ¿Cuánto cobran los abogados por registrar una marca?"
                required
                disabled={isLoading}
                minLength={10}
              />
              <p className="mt-2 text-xs text-gray-500">
                Describe tu consulta de forma simple. Nuestra IA la reformulará para obtener la mejor estimación posible.
              </p>
            </div>
            
            <ConsultButton isLoading={isLoading} step={step} />
          </form>

          {estimate && <EstimateDisplay estimate={estimate} />}
        </div>
      </div>
    </div>
  );
} 