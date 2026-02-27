"use client";
import { useRef } from "react";

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

interface BrandingData {
  nombreDespacho?: string;
  slogan?: string;
  logoURL?: string;
  colores?: { primario?: string; secundario?: string; terciario?: string };
  signer?: { name?: string; role?: string; phone?: string; email?: string };
}

interface OnePagerViewProps {
  data: OnePagerData;
  brandingInfo?: BrandingData | null;
}

export default function OnePagerView({ data, brandingInfo }: OnePagerViewProps) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const primary = brandingInfo?.colores?.primario || "#1a1a2e";
  const accent = brandingInfo?.colores?.secundario || "#3B82F6";
  const tertiary = brandingInfo?.colores?.terciario || "#6366f1";
  const logoURL = brandingInfo?.logoURL || "";
  const signer = brandingInfo?.signer;

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    const el = pdfRef.current;
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const finalH = Math.min(imgH, pageH);
    pdf.addImage(imgData, "PNG", 0, 0, imgW, finalH);
    pdf.save(`Cotizacion-${data.folio || "OnePager"}.pdf`);
  };

  return (
    <div>
      {/* Export Button */}
      <div className="flex justify-end mb-4 gap-2">
        <button onClick={handleExportPDF} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" style={{ backgroundColor: primary }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Exportar PDF
        </button>
      </div>

      {/* One Pager Document */}
      <div ref={pdfRef} className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto" style={{ fontFamily: "'Inter', sans-serif", minHeight: "279mm" }}>

        {/* Header */}
        <div className="flex justify-between items-center p-8 pb-6" style={{ backgroundColor: primary }}>
          <div className="flex items-center gap-4">
            {logoURL && <img src={logoURL} alt="Logo" className="h-12 w-auto object-contain rounded" crossOrigin="anonymous" />}
            <div>
              <h2 className="text-white text-2xl font-bold tracking-tight">{data.despacho?.nombre || brandingInfo?.nombreDespacho || "Despacho Legal"}</h2>
              {(data.despacho?.responsable || brandingInfo?.slogan) && <p className="text-sm mt-1" style={{ color: tertiary }}>{data.despacho?.responsable || brandingInfo?.slogan}</p>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-white text-3xl font-extrabold tracking-tight opacity-90">COTIZACION</div>
            <div className="text-sm mt-1" style={{ color: tertiary }}>#{data.folio || "COT-0000"}</div>
          </div>
        </div>

        {/* Accent bar */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${accent}, ${tertiary})` }}></div>

        {/* Client & Date */}
        <div className="grid grid-cols-2 gap-6 px-8 py-5 bg-gray-50 border-b border-gray-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>Para</p>
            <p className="text-sm font-semibold text-gray-900">{data.cliente?.nombre || "Cliente"}</p>
            {data.cliente?.empresa && <p className="text-xs text-gray-500">{data.cliente.empresa}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>Fecha</p>
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
                <th className="text-left py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>Servicio</th>
                <th className="text-right py-3 text-xs font-semibold uppercase tracking-wider w-32" style={{ color: accent }}>Honorarios</th>
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
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: accent }}>Condiciones</p>
            <div className="space-y-1 text-xs text-gray-600">
              {data.condiciones?.vigencia && <p><span className="font-medium text-gray-700">Vigencia:</span> {data.condiciones.vigencia}</p>}
              {data.condiciones?.formaPago && <p><span className="font-medium text-gray-700">Forma de pago:</span> {data.condiciones.formaPago}</p>}
              {data.condiciones?.tiempoEstimado && <p><span className="font-medium text-gray-700">Tiempo estimado:</span> {data.condiciones.tiempoEstimado}</p>}
            </div>
          </div>
          <div>
            {data.notas && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: accent }}>Notas</p>
                <p className="text-xs text-gray-600">{data.notas}</p>
              </>
            )}
          </div>
        </div>

        {/* Signer */}
        {signer?.name && (
          <div className="px-8 py-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{signer.name}</p>
            {signer.role && <p className="text-xs text-gray-500">{signer.role}</p>}
            {signer.email && <p className="text-xs text-gray-400">{signer.email}</p>}
            {signer.phone && <p className="text-xs text-gray-400">{signer.phone}</p>}
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-4 text-center" style={{ backgroundColor: primary }}>
          <p className="text-xs" style={{ color: tertiary }}>{data.despacho?.nombre || brandingInfo?.nombreDespacho} | {data.folio}</p>
        </div>
      </div>
    </div>
  );
}