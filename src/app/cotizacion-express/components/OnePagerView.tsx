"use client";
import { useRef, useState } from "react";

/* ---- Interfaces ---- */
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

type TemplateName = "ejecutivo" | "moderno" | "boutique";
type PageSize = "carta" | "a4";

const TEMPLATES: { id: TemplateName; label: string; desc: string }[] = [
  { id: "ejecutivo", label: "Ejecutivo", desc: "Corporativo y serio" },
  { id: "moderno", label: "Moderno", desc: "Limpio y actual" },
  { id: "boutique", label: "Boutique", desc: "Elegante y premium" },
];

const PAGE_SIZES: { id: PageSize; label: string; w: number; h: number; pdfFormat: string }[] = [
  { id: "carta", label: "Carta", w: 216, h: 279, pdfFormat: "letter" },
  { id: "a4", label: "A4", w: 210, h: 297, pdfFormat: "a4" },
];

export default function OnePagerView({ data, brandingInfo }: OnePagerViewProps) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<TemplateName>("ejecutivo");
  const [pageSize, setPageSize] = useState<PageSize>("carta");
  const [customColors, setCustomColors] = useState<{primary:string;accent:string;tertiary:string}>({
    primary: brandingInfo?.colores?.primario || "#1a1a2e",
    accent: brandingInfo?.colores?.secundario || "#3B82F6",
    tertiary: brandingInfo?.colores?.terciario || "#6366f1",
  });
  const [showColors, setShowColors] = useState(false);

  const c = customColors;
  const logoURL = brandingInfo?.logoURL || "";
  const signer = brandingInfo?.signer;
  const despachoName = data.despacho?.nombre || brandingInfo?.nombreDespacho || "Despacho Legal";
  const sloganText = data.despacho?.responsable || brandingInfo?.slogan || "";
  const ps = PAGE_SIZES.find((p) => p.id === pageSize) || PAGE_SIZES[0];

  /* ---- PDF Export ---- */
  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: ps.pdfFormat as any });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const finalH = Math.min(imgH, pageH);
    pdf.addImage(imgData, "PNG", 0, 0, imgW, finalH);
    pdf.save(`Cotizacion-${data.folio || "OnePager"}.pdf`);
  };

  /* ---- Shared: services table rows ---- */
  const servRows = data.servicios?.map((s, i) => (
    <tr key={i} className="border-b border-gray-100">
      <td className="py-3 text-sm text-gray-700">{s.descripcion}</td>
      <td className="py-3 text-sm text-gray-900 font-medium text-right">{s.precio}</td>
    </tr>
  ));

  /* ---- Shared: totals block ---- */
  const totalsBlock = (
    <div className="w-64">
      <div className="flex justify-between py-2 text-sm"><span className="text-gray-500">Subtotal</span><span className="text-gray-900 font-medium">{data.subtotal || ""}</span></div>
      <div className="flex justify-between py-2 text-sm border-b border-gray-200"><span className="text-gray-500">IVA (16%)</span><span className="text-gray-900 font-medium">{data.iva || ""}</span></div>
      <div className="flex justify-between py-3 text-base font-bold" style={{ color: c.primary }}><span>Total</span><span>{data.total || ""}</span></div>
    </div>
  );

  /* ---- Shared: conditions ---- */
  const condBlock = (
    <div className="space-y-1 text-xs text-gray-600">
      {data.condiciones?.vigencia && <p><span className="font-medium text-gray-700">Vigencia:</span> {data.condiciones.vigencia}</p>}
      {data.condiciones?.formaPago && <p><span className="font-medium text-gray-700">Forma de pago:</span> {data.condiciones.formaPago}</p>}
      {data.condiciones?.tiempoEstimado && <p><span className="font-medium text-gray-700">Tiempo estimado:</span> {data.condiciones.tiempoEstimado}</p>}
    </div>
  );

  /* ---- Shared: signer ---- */
  const signerBlock = signer?.name ? (
    <div className="px-8 py-4 border-t border-gray-200">
      <p className="text-sm font-semibold text-gray-900">{signer.name}</p>
      {signer.role && <p className="text-xs text-gray-500">{signer.role}</p>}
      {signer.email && <p className="text-xs text-gray-400">{signer.email}</p>}
      {signer.phone && <p className="text-xs text-gray-400">{signer.phone}</p>}
    </div>
  ) : null;

  /* ---- Page dimensions for CSS (proportional) ---- */
  const pageH = `${ps.h}mm`;

  /* ========== TEMPLATE: EJECUTIVO ========== */
  const renderEjecutivo = () => (
    <div ref={pdfRef} className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto flex flex-col" style={{ fontFamily: "'Inter', sans-serif", minHeight: pageH }}>
      {/* Header */}
      <div className="flex justify-between items-center p-8 pb-6" style={{ backgroundColor: c.primary }}>
        <div className="flex items-center gap-4">
          {logoURL && <img src={logoURL} alt="Logo" className="h-12 w-auto object-contain rounded" crossOrigin="anonymous" />}
          <div>
            <h2 className="text-white text-2xl font-bold tracking-tight">{despachoName}</h2>
            {sloganText && <p className="text-sm mt-1" style={{ color: c.tertiary }}>{sloganText}</p>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-3xl font-extrabold tracking-tight opacity-90">COTIZACION</div>
          <div className="text-sm mt-1" style={{ color: c.tertiary }}>#{data.folio || "COT-0000"}</div>
        </div>
      </div>
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${c.accent}, ${c.tertiary})` }} />
      {/* Body (flex-1 fills remaining space) */}
      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-6 px-8 py-5 bg-gray-50 border-b border-gray-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: c.accent }}>Para</p>
            <p className="text-sm font-semibold text-gray-900">{data.cliente?.nombre || "Cliente"}</p>
            {data.cliente?.empresa && <p className="text-xs text-gray-500">{data.cliente.empresa}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: c.accent }}>Fecha</p>
            <p className="text-sm text-gray-700">{data.fecha || ""}</p>
          </div>
        </div>
        <div className="px-8 py-5 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">{data.titulo || "Servicios Legales"}</h3>
        </div>
        <div className="px-8 py-4">
          <table className="w-full">
            <thead><tr className="border-b-2" style={{ borderColor: c.accent }}>
              <th className="text-left py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: c.accent }}>Servicio</th>
              <th className="text-right py-3 text-xs font-semibold uppercase tracking-wider w-32" style={{ color: c.accent }}>Honorarios</th>
            </tr></thead>
            <tbody>{servRows}</tbody>
          </table>
        </div>
        <div className="px-8 py-4 flex justify-end">{totalsBlock}</div>
        <div className="grid grid-cols-2 gap-6 px-8 py-5 bg-gray-50 border-t border-gray-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: c.accent }}>Condiciones</p>
            {condBlock}
          </div>
          <div>
            {data.notas && <><p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: c.accent }}>Notas</p><p className="text-xs text-gray-600">{data.notas}</p></>}
          </div>
        </div>
        {signerBlock}
        {/* Spacer pushes footer down */}
        <div className="flex-1" />
      </div>
      {/* Footer (always at bottom) */}
      <div className="px-8 py-4 text-center" style={{ backgroundColor: c.primary }}>
        <p className="text-xs" style={{ color: c.tertiary }}>{despachoName} | {data.folio}</p>
      </div>
    </div>
  );

  /* ========== TEMPLATE: MODERNO ========== */
  const renderModerno = () => (
    <div ref={pdfRef} className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-3xl mx-auto" style={{ fontFamily: "'Inter', sans-serif", minHeight: pageH }}>
      <div className="flex" style={{ minHeight: pageH }}>
        <div className="w-2 shrink-0" style={{ backgroundColor: c.accent }} />
        <div className="flex-1 flex flex-col">
          <div className="px-8 pt-8 pb-4 flex justify-between items-start">
            <div className="flex items-center gap-3">
              {logoURL && <img src={logoURL} alt="Logo" className="h-10 w-auto rounded" crossOrigin="anonymous" />}
              <div>
                <h2 className="text-xl font-bold" style={{ color: c.primary }}>{despachoName}</h2>
                {sloganText && <p className="text-xs text-gray-400 mt-0.5">{sloganText}</p>}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: c.accent }}>#{data.folio || "COT-0000"}</span>
              <p className="text-xs text-gray-400 mt-1">{data.fecha || ""}</p>
            </div>
          </div>
          <div className="px-8 pb-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: c.primary + "08" }}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.accent }}>Cliente</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{data.cliente?.nombre || "Cliente"}</p>
                  {data.cliente?.empresa && <p className="text-xs text-gray-500">{data.cliente.empresa}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.accent }}>Proyecto</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{data.titulo || "Servicios Legales"}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-8 py-4">
            <table className="w-full">
              <thead><tr style={{ borderBottom: `2px solid ${c.accent}` }}>
                <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: c.accent }}>Servicio</th>
                <th className="text-right py-2 text-[10px] font-bold uppercase tracking-wider w-28" style={{ color: c.accent }}>Honorarios</th>
              </tr></thead>
              <tbody>
                {data.servicios?.map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-gray-50/50" : ""}>
                    <td className="py-3 text-sm text-gray-700 pl-2">{s.descripcion}</td>
                    <td className="py-3 text-sm text-gray-900 font-semibold text-right pr-2">{s.precio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-3 flex justify-end">
            <div className="rounded-xl p-4 w-64" style={{ backgroundColor: c.primary + "08" }}>
              <div className="flex justify-between py-1 text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">{data.subtotal}</span></div>
              <div className="flex justify-between py-1 text-sm"><span className="text-gray-500">IVA</span><span className="font-medium">{data.iva}</span></div>
              <div className="flex justify-between pt-2 mt-1 border-t text-lg font-bold" style={{ color: c.primary, borderColor: c.accent }}>
                <span>Total</span><span>{data.total}</span>
              </div>
            </div>
          </div>
          <div className="px-8 py-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: c.accent }}>Condiciones</p>
              {condBlock}
            </div>
            {data.notas && (
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: c.accent }}>Notas</p>
                <p className="text-xs text-gray-600">{data.notas}</p>
              </div>
            )}
          </div>
          {signer?.name && (
            <div className="px-8 py-3">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: c.primary + "06" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: c.accent }}>{signer.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{signer.name}</p>
                  <p className="text-xs text-gray-500">{signer.role}{signer.email ? ` | ${signer.email}` : ""}</p>
                </div>
              </div>
            </div>
          )}
          {/* Spacer pushes footer down */}
          <div className="flex-1" />
          {/* Footer */}
          <div className="px-8 py-3 border-t border-gray-100 flex justify-between items-center">
            <p className="text-xs text-gray-400">{despachoName}</p>
            <p className="text-xs text-gray-400">{data.folio}</p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ========== TEMPLATE: BOUTIQUE ========== */
  const renderBoutique = () => (
    <div ref={pdfRef} className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto flex flex-col" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", minHeight: pageH }}>
      {/* Header */}
      <div className="relative p-10 pb-6" style={{ backgroundColor: c.primary }}>
        <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 80% 20%, ${c.accent}, transparent 50%)` }} />
        <div className="relative flex justify-between items-start">
          <div className="flex items-center gap-4">
            {logoURL && <img src={logoURL} alt="Logo" className="h-14 w-auto rounded" crossOrigin="anonymous" />}
            <div>
              <h2 className="text-white text-2xl font-normal tracking-wide">{despachoName}</h2>
              {sloganText && <p className="text-xs tracking-widest uppercase mt-1" style={{ color: c.accent }}>{sloganText}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-widest uppercase" style={{ color: c.accent }}>Propuesta de Servicios</p>
            <p className="text-white text-lg mt-1 font-light">{data.folio || "COT-0000"}</p>
          </div>
        </div>
      </div>
      <div className="h-px" style={{ backgroundColor: c.accent }} />
      {/* Body (flex-1 fills remaining space) */}
      <div className="flex-1 flex flex-col">
        <div className="px-10 py-6 flex justify-between border-b border-gray-200">
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: c.accent }}>Preparado para</p>
            <p className="text-base text-gray-900">{data.cliente?.nombre || "Cliente"}</p>
            {data.cliente?.empresa && <p className="text-sm text-gray-500 italic">{data.cliente.empresa}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: c.accent }}>Fecha</p>
            <p className="text-sm text-gray-700">{data.fecha}</p>
          </div>
        </div>
        <div className="px-10 py-5 border-b border-gray-200">
          <h3 className="text-xl text-gray-900 font-normal italic">{data.titulo || "Servicios Legales"}</h3>
        </div>
        <div className="px-10 py-6">
          {data.servicios?.map((s, i) => (
            <div key={i} className="flex justify-between items-baseline py-3" style={{ borderBottom: i < (data.servicios?.length || 0) - 1 ? "1px solid #e5e7eb" : "none" }}>
              <span className="text-sm text-gray-700 flex-1 pr-4">{s.descripcion}</span>
              <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{s.precio}</span>
            </div>
          ))}
        </div>
        <div className="px-10 py-4 flex justify-end">
          <div className="w-60 border-t-2" style={{ borderColor: c.accent }}>
            <div className="flex justify-between py-2 text-sm"><span className="text-gray-500">Subtotal</span><span>{data.subtotal}</span></div>
            <div className="flex justify-between py-2 text-sm"><span className="text-gray-500">IVA</span><span>{data.iva}</span></div>
            <div className="flex justify-between py-3 text-lg border-t" style={{ color: c.primary, borderColor: c.accent }}>
              <span className="font-normal">Total</span><span className="font-bold">{data.total}</span>
            </div>
          </div>
        </div>
        <div className="px-10 py-5 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-2" style={{ color: c.accent }}>Condiciones</p>
            {condBlock}
          </div>
          {data.notas && (
            <div>
              <p className="text-[10px] tracking-widest uppercase mb-2" style={{ color: c.accent }}>Notas</p>
              <p className="text-xs text-gray-600 italic">{data.notas}</p>
            </div>
          )}
        </div>
        {signer?.name && (
          <div className="px-10 py-5 border-t border-gray-200">
            <div className="border-b pb-3 mb-2" style={{ borderColor: c.accent + "40", width: "200px" }}>
              <p className="text-sm text-gray-900">{signer.name}</p>
              {signer.role && <p className="text-xs text-gray-500 italic">{signer.role}</p>}
            </div>
            {signer.email && <p className="text-xs text-gray-400">{signer.email}</p>}
            {signer.phone && <p className="text-xs text-gray-400">{signer.phone}</p>}
          </div>
        )}
        {/* Spacer pushes footer down */}
        <div className="flex-1" />
      </div>
      {/* Footer (always at bottom) */}
      <div className="py-4 text-center" style={{ backgroundColor: c.primary }}>
        <p className="text-xs tracking-widest" style={{ color: c.accent }}>{despachoName}</p>
      </div>
    </div>
  );

  /* ========== RENDER SWITCH ========== */
  const renderTemplate = () => {
    switch (template) {
      case "moderno": return renderModerno();
      case "boutique": return renderBoutique();
      default: return renderEjecutivo();
    }
  };

  return (
    <div>
      {/* ---- Toolbar ---- */}
      <div className="mb-6 space-y-4">
        {/* Template selector */}
        <div className="flex gap-3 flex-wrap">
          {TEMPLATES.map((t) => (
            <button key={t.id} onClick={() => setTemplate(t.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${template === t.id ? "text-white shadow-md scale-105" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
              style={template === t.id ? { backgroundColor: c.primary, borderColor: c.primary } : {}}>
              <span className="block">{t.label}</span>
              <span className="block text-[10px] opacity-70">{t.desc}</span>
            </button>
          ))}
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Page size toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {PAGE_SIZES.map((p) => (
              <button key={p.id} onClick={() => setPageSize(p.id)}
                className={`px-3 py-2 text-xs font-medium transition-all ${pageSize === p.id ? "text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                style={pageSize === p.id ? { backgroundColor: c.primary } : {}}>
                {p.label} <span className="opacity-60">({p.w}x{p.h}mm)</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowColors(!showColors)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all">
            <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c.primary }} />
            {showColors ? "Ocultar colores" : "Personalizar colores"}
          </button>
          <button onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white font-medium text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: c.primary }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Exportar PDF ({ps.label})
          </button>
        </div>

        {/* Color pickers (collapsible) */}
        {showColors && (
          <div className="flex gap-4 flex-wrap p-4 rounded-xl bg-gray-50 border border-gray-200">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="color" value={c.primary} onChange={(e) => setCustomColors({ ...c, primary: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
              Primario
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="color" value={c.accent} onChange={(e) => setCustomColors({ ...c, accent: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
              Acento
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="color" value={c.tertiary} onChange={(e) => setCustomColors({ ...c, tertiary: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
              Terciario
            </label>
            <button onClick={() => setCustomColors({ primary: brandingInfo?.colores?.primario || "#1a1a2e", accent: brandingInfo?.colores?.secundario || "#3B82F6", tertiary: brandingInfo?.colores?.terciario || "#6366f1" })}
              className="text-xs text-gray-400 hover:text-gray-600 underline ml-auto">Restablecer</button>
          </div>
        )}
      </div>

      {/* ---- The document ---- */}
      {renderTemplate()}
    </div>
  );
}