"use client";

interface OnePagerData {
  folio?: string;
  fecha?: string;
  despacho?: { nombre?: string; responsable?: string };
  cliente?: { nombre?: string; empresa?: string };
  titulo?: string;
  servicios?: { descripcion: string; precio: string }[];
  subtotal?: string;
  iva?: string;
  total?: string;
  condiciones?: { vigencia?: string; formaPago?: string; tiempoEstimado?: string };
  notas?: string;
}

interface OnePagerViewProps {
  data: OnePagerData;
  brandingColors?: { primario?: string; secundario?: string };
}

export default function OnePagerView({ data, brandingColors }: OnePagerViewProps) {
  const primary = brandingColors?.primario || "#1a1a2e";
  const accent = brandingColors?.secundario || "#3B82F6";

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex justify-between items-start p-8 pb-6" style={{ backgroundColor: primary }}>
        <div>
          <h2 className="text-white text-2xl font-bold tracking-tight">{data.despacho?.nombre || "Despacho Legal"}</h2>
          {data.despacho?.responsable && <p className="text-gray-300 text-sm mt-1">{data.despacho.responsable}</p>}
        </div>
        <div className="text-right">
          <div className="text-white text-3xl font-extrabold tracking-tight opacity-90">COTIZACION</div>
          <div className="text-gray-300 text-sm mt-1">#{data.folio || "COT-0000"}</div>
        </div>
      </div>

      {/* Client & Date Info */}
      <div className="grid grid-cols-2 gap-6 px-8 py-5 bg-gray-50 border-b border-gray-200">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Para</p>
          <p className="text-sm font-semibold text-gray-900">{data.cliente?.nombre || "Cliente"}</p>
          {data.cliente?.empresa && <p className="text-xs text-gray-500">{data.cliente.empresa}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Fecha</p>
          <p className="text-sm text-gray-700">{data.fecha || ""}</p>
        </div>
      </div>

      {/* Title */}
      <div className="px-8 py-5 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">{data.titulo || "Servicios Legales"}</h3>
      </div>

      {/* Services Table */}
      <div className="px-8 py-4">
        <table className="w-full">
          <thead>
            <tr className="border-b-2" style={{ borderColor: accent }}>
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Servicio</th>
              <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Honorarios</th>
            </tr>
          </thead>
          <tbody>
            {data.servicios?.map((s, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3 text-sm text-gray-700">{s.descripcion}</td>
                <td className="py-3 text-sm text-gray-900 font-medium text-right">{s.precio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-8 py-4 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-900 font-medium">{data.subtotal || ""}</span>
          </div>
          <div className="flex justify-between py-2 text-sm border-b border-gray-200">
            <span className="text-gray-500">IVA (16%)</span>
            <span className="text-gray-900 font-medium">{data.iva || ""}</span>
          </div>
          <div className="flex justify-between py-3 text-base font-bold" style={{ color: primary }}>
            <span>Total</span>
            <span>{data.total || ""}</span>
          </div>
        </div>
      </div>

      {/* Conditions & Notes */}
      <div className="grid grid-cols-2 gap-6 px-8 py-5 bg-gray-50 border-t border-gray-200">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Condiciones</p>
          <div className="space-y-1 text-xs text-gray-600">
            {data.condiciones?.vigencia && <p><span className="font-medium text-gray-700">Vigencia:</span> {data.condiciones.vigencia}</p>}
            {data.condiciones?.formaPago && <p><span className="font-medium text-gray-700">Forma de pago:</span> {data.condiciones.formaPago}</p>}
            {data.condiciones?.tiempoEstimado && <p><span className="font-medium text-gray-700">Tiempo estimado:</span> {data.condiciones.tiempoEstimado}</p>}
          </div>
        </div>
        <div>
          {data.notas && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notas</p>
              <p className="text-xs text-gray-600">{data.notas}</p>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 text-center border-t border-gray-200" style={{ backgroundColor: primary }}>
        <p className="text-xs text-gray-300">{data.despacho?.nombre} | {data.folio}</p>
      </div>
    </div>
  );
}