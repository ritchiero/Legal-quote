"use client";
import { useRef, useState } from "react";

interface BrandingData {
    nombreDespacho?: string;
    slogan?: string;
    logoURL?: string;
    colores?: { primario?: string; secundario?: string; terciario?: string };
    signer?: { name?: string; role?: string; phone?: string; email?: string };
}

interface CortaViewProps {
    contenido: string;
    brandingInfo?: BrandingData | null;
    firmName?: string;
    onContentChange?: (content: string) => void;
}

type PageSize = "carta" | "a4";

const PAGE_SIZES: { id: PageSize; label: string; w: number; h: number; pdfFormat: string }[] = [
  { id: "carta", label: "Carta", w: 216, h: 279, pdfFormat: "letter" },
  { id: "a4", label: "A4", w: 210, h: 297, pdfFormat: "a4" },
  ];

export default function CortaView({ contenido, brandingInfo, firmName, onContentChange }: CortaViewProps) {
    const pdfRef = useRef<HTMLDivElement>(null);
    const [pageSize, setPageSize] = useState<PageSize>("carta");
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(contenido);

  const c = {
        primary: brandingInfo?.colores?.primario || "#1a365d",
        accent: brandingInfo?.colores?.secundario || "#2b6cb0",
        tertiary: brandingInfo?.colores?.terciario || "#4a90d9",
  };
    const logoURL = brandingInfo?.logoURL || "";
    const signer = brandingInfo?.signer;
    const despachoName = firmName || brandingInfo?.nombreDespacho || "Despacho Legal";
    const sloganText = brandingInfo?.slogan || "";
    const ps = PAGE_SIZES.find((p) => p.id === pageSize) || PAGE_SIZES[0];

  const today = new Date();
    const formattedDate = today.toLocaleDateString("es-MX", {
          day: "numeric",
          month: "long",
          year: "numeric",
    });

  const handleExportPDF = async () => {
        if (!pdfRef.current) return;
        const html2canvas = (await import("html2canvas")).default;
        const jsPDF = (await import("jspdf")).default;
        const el = pdfRef.current;
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: ps.pdfFormat as any });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgW = pageW;
        const imgH = (canvas.height * imgW) / canvas.width;

        if (imgH <= pageH) {
                pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
        } else {
                let y = 0;
                let page = 0;
                while (y < imgH) {
                          if (page > 0) pdf.addPage();
                          pdf.addImage(imgData, "PNG", 0, -y, imgW, imgH);
                          y += pageH;
                          page++;
                }
        }
        pdf.save(`Cotizacion-Corta-${formattedDate}.pdf`);
  };

  const handleSaveEdit = () => {
        setIsEditing(false);
        if (onContentChange) onContentChange(editContent);
  };

  const renderContent = (text: string) => {
        return text.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-3" />;

                                          const isBold = /^\*\*(.+)\*\*$/.test(trimmed);
                const isHeading = /^#{1,3}\s/.test(trimmed) || /^[A-Z\u00C0-\u00DC][A-Z\u00C0-\u00DC\s]{5,}$/.test(trimmed);
                const isSeparator = /^[-=_]{3,}$/.test(trimmed);
                const isBullet = /^[-*]\s/.test(trimmed);
                const isNumbered = /^\d+[.)]\s/.test(trimmed);

                                          if (isSeparator) {
                                                    return <div key={i} className="my-3 h-px" style={{ backgroundColor: c.accent + "30" }} />;
                                          }

                                          if (isHeading || isBold) {
                                                    const clean = trimmed.replace(/^#{1,3}\s/, "").replace(/^\*\*|\*\*$/g, "");
                                                    return (
                                                                <h3 key={i} className="text-base font-bold mt-4 mb-2" style={{ color: c.primary }}>
                                                                  {clean}
                                                                </h3>h3>
                                                              );
                                          }

                                          if (isBullet) {
                                                    return (
                                                                <div key={i} className="flex gap-2 ml-4 my-0.5">
                                                                            <span style={{ color: c.accent }} className="font-bold mt-0.5 text-xs">&#9679;</span>span>
                                                                            <span className="text-sm text-gray-700 leading-relaxed">{trimmed.replace(/^[-*]\s/, "")}</span>span>
                                                                </div>div>
                                                              );
                                          }
          
                if (isNumbered) {
                          const num = trimmed.match(/^(\d+)[.)]\s/)?.[1] || "";
                          return (
                                      <div key={i} className="flex gap-2 ml-4 my-0.5">
                                                  <span className="text-sm font-semibold min-w-[1.2rem]" style={{ color: c.accent }}>{num}.</span>span>
                                                  <span className="text-sm text-gray-700 leading-relaxed">{trimmed.replace(/^\d+[.)]\s/, "")}</span>span>
                                      </div>div>
                                    );
                }
          
                const formatted = trimmed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
                return (
                          <p
                                      key={i}
                                      className="text-sm text-gray-700 leading-relaxed my-0.5"
                                      dangerouslySetInnerHTML={{ __html: formatted }}
                                    />
                        );
        });
  };
  
    return (
          <div>
            {/* Toolbar */}
                <div className="mb-4 flex items-center gap-3 flex-wrap">
                        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                          {PAGE_SIZES.map((p) => (
                        <button
                                        key={p.id}
                                        onClick={() => setPageSize(p.id)}
                                        className={`px-3 py-2 text-xs font-medium transition-all ${
                                                          pageSize === p.id ? "text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                                        }`}
                                        style={pageSize === p.id ? { backgroundColor: c.primary } : {}}
                                      >
                          {p.label}
                        </button>button>
                      ))}
                        </div>div>
                
                        <button
                                    onClick={() => {
                                                  if (isEditing) {
                                                                  handleSaveEdit();
                                                  } else {
                                                                  setEditContent(contenido);
                                                                  setIsEditing(true);
                                                  }
                                    }}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                                  isEditing
                                                    ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                    }`}
                                  >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isEditing ? (
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                ) : (
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                )}
                                  </svg>svg>
                          {isEditing ? "Guardar" : "Editar"}
                        </button>button>
                
                        <button
                                    onClick={handleExportPDF}
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white font-medium text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                                    style={{ backgroundColor: c.primary }}
                                  >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>svg>
                                  Descargar PDF ({ps.label})
                        </button>button>
                </div>div>
          
            {/* Document */}
                <div
                          ref={pdfRef}
                          className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto"
                          style={{ fontFamily: "'Inter', sans-serif", minHeight: `${ps.h}mm` }}
                        >
                  {/* Header */}
                        <div className="p-8 pb-5" style={{ backgroundColor: c.primary }}>
                                  <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-4">
                                                {logoURL && (
                                          <img
                                                              src={logoURL}
                                                              alt="Logo"
                                                              className="h-12 w-auto object-contain rounded"
                                                              crossOrigin="anonymous"
                                                            />
                                        )}
                                                            <div>
                                                                            <h2 className="text-white text-2xl font-bold tracking-tight">{despachoName}</h2>h2>
                                                              {sloganText && <p className="text-sm mt-1 text-white/60">{sloganText}</p>p>}
                                                            </div>div>
                                              </div>div>
                                              <div className="text-right">
                                                            <div className="text-white text-xl font-extrabold tracking-tight opacity-90">
                                                                            COTIZACION
                                                            </div>div>
                                                            <div className="text-sm mt-1 text-white/50">{formattedDate}</div>div>
                                              </div>div>
                                  </div>div>
                        </div>div>
                        <div className="h-1" style={{ background: `linear-gradient(90deg, ${c.accent}, ${c.tertiary})` }} />
                
                  {/* Content */}
                        <div className="px-8 py-6">
                          {isEditing ? (
                                      <textarea
                                                      value={editContent}
                                                      onChange={(e) => setEditContent(e.target.value)}
                                                      className="w-full min-h-[400px] p-4 border border-gray-200 rounded-lg text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                                                      style={{ fontFamily: "'Inter', sans-serif" }}
                                                    />
                                    ) : (
                                      <div className="prose-sm">{renderContent(contenido)}</div>div>
                                  )}
                        </div>div>
                
                  {/* Signer */}
                  {signer?.name && (
                                    <div className="px-8 py-4 border-t border-gray-200">
                                                <div className="mt-4 mb-2">
                                                              <div className="w-40 border-b-2 mb-3" style={{ borderColor: c.accent }} />
                                                              <p className="text-sm font-semibold text-gray-900">{signer.name}</p>p>
                                                  {signer.role && <p className="text-xs text-gray-500">{signer.role}</p>p>}
                                                  {signer.email && <p className="text-xs text-gray-400 mt-1">{signer.email}</p>p>}
                                                  {signer.phone && <p className="text-xs text-gray-400">{signer.phone}</p>p>}
                                                </div>div>
                                    </div>div>
                        )}
                
                  {/* Footer */}
                        <div className="px-8 py-4 text-center" style={{ backgroundColor: c.primary }}>
                                  <p className="text-xs text-white/50">{despachoName} | Documento confidencial | {formattedDate}</p>p>
                        </div>div>
                </div>div>
          </div>div>
        );
}</div>
