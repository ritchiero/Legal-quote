"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { db } from "@/lib/firebase/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import SlateEditor from "./SlateEditor";
import OnePagerView from "./OnePagerView";
import InputGroup, { AIButton } from "@/components/InputGroup";
import RequirementsAIModal from "@/components/modals/RequirementsAIModal";
import PaymentAIModal from "@/components/modals/PaymentAIModal";
import { TipoCotizacion, tiposCotizacion } from "@/constants/cotizacion";
import { formatDate } from "@/lib/utils/date";
import {
  SparklesIcon,
  UserIcon,
  BuildingOfficeIcon,
  BoltIcon,
  ClockIcon,
  MapPinIcon,
  ClipboardDocumentCheckIcon,
  CreditCardIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";

interface BrandingInfo {
  anoFundacion?: string;
  descripcion?: string;
  sitioWeb?: string;
  redes?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  colores: {
    primario: string;
    secundario: string;
    terciario: string;
  };
  logoURL?: string;
  nombreDespacho: string;
  slogan?: string;
  updatedAt: string;
  userId: string;
  signer?: {
    name: string;
    role: string;
    phone?: string;
    email: string;
    other?: string;
  };
}

interface Servicio {
  id: string;
  createdAt: string;
  descripcion: string;
  detalles: string;
  incluye: Record<string, string>;
  nombre: string;
  precio: string;
  tiempo: string;
  userId: string;
}

interface ContactInfo {
  name?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  web?: string;
  address?: string;
}


const ServicioInput = ({
  onManualChange,
  onServiceSelect,
  value,
}: {
  onManualChange: (value: string) => void;
  onServiceSelect: (servicio: Servicio) => void;
  value: string;
}) => {
  const { user } = useAuth();
  const [showSelector, setShowSelector] = useState(false);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchServicios = async () => {
      if (!user?.uid) return;
      setIsLoading(true);

      try {
        const q = query(
          collection(db, "servicios"),
          where("userId", "==", user.uid),
        );

        const querySnapshot = await getDocs(q);
        const serviciosData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          createdAt: doc.data().createdAt || "",
          descripcion: doc.data().descripcion || "",
          detalles: doc.data().detalles || "",
          incluye: doc.data().incluye || {},
          nombre: doc.data().nombre || "",
          precio: doc.data().precio || "",
          ...doc.data(),
        })) as Servicio[];

        setServicios(serviciosData);
      } catch (error) {
        console.error("Error fetching servicios:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (showSelector) {
      fetchServicios();
    }
  }, [user?.uid, showSelector]);

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 hover:border-gray-400 transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="p-5">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
            <div className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
              <ClipboardDocumentCheckIcon className="w-5 h-5" />
            </div>
            <label className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
              Descripción breve del servicio
                  </label>
                </div>
                {value.trim() && (
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2l4-4" /></svg>
                )}
              </div>

          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-full bg-gray-100 border border-gray-200">
              <button
                type="button"
                onClick={() => setShowSelector(false)}
                className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all ${!showSelector
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setShowSelector(true)}
                className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all ${showSelector
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Servicios Guardados
              </button>
            </div>
          </div>

          {showSelector ? (
            <div className="relative mt-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-[120px] bg-gray-50 rounded border border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
                    <span>Cargando servicios...</span>
                  </div>
                </div>
              ) : servicios.length > 0 ? (
                <div className="relative">
                  <select
                    className="w-full px-3 py-2 text-sm bg-transparent border-none rounded appearance-none truncate cursor-pointer focus:ring-0 text-gray-900"
                    onChange={(e) => {
                      const servicio = servicios.find(
                        (s) => s.id === e.target.value,
                      );
                      if (servicio) onServiceSelect(servicio);
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled className="text-gray-900">
                      Seleccione un servicio guardado
                    </option>
                    {servicios.map((servicio) => (
                      <option
                        key={servicio.id}
                        value={servicio.id}
                        className="text-gray-900"
                      >
                        {servicio.descripcion}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[120px] border border-dashed border-gray-300 rounded gap-3">
                  <span className="text-sm text-gray-500">
                    No hay servicios guardados
                  </span>
                  <button
                    onClick={() => window.location.href = '/settings/profile'}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Crea tu primer servicio
                  </button>
                </div>
              )}
            </div>
          ) : (
            <textarea
              className="w-full px-3 py-2 bg-transparent border-none text-sm min-h-[120px] resize-none focus:ring-0 placeholder-gray-400 text-gray-900"
              placeholder="Describa brevemente el servicio legal requerido"
              value={value}
              onChange={(e) => onManualChange(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

interface CotizacionGenerada {
  contenido: string;
  error?: string;
}

const formatCotizacion = (content: string, tipo: TipoCotizacion): string => {
  if (tipo === "corta") {
    const template = `
<div style="font-family: Arial, sans-serif; line-height: 1.6;">
  <div style="font-size: 14px;">{ciudad}, {fecha}</div>

  <h1 style="font-size: 20px; font-weight: bold; margin: 24px 0 16px; text-align: center;">COTIZACIÓN DE SERVICIOS LEGALES</h1>
  <h2 style="font-size: 18px; color: #2563eb; margin: 0 0 24px; text-align: center;">{servicio}</h2>
  <div style="font-weight: 500;">Para: {destinatario}</div>

  <p style="margin: 24px 0;">Estimado {tratamiento} {apellido}:</p>

  <p style="margin-bottom: 24px;">{descripcion}</p>

  <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0;">
    <div style="font-size: 15px; margin-bottom: 8px;"><strong>Duración:</strong> {duracion}</div>
    <div style="font-size: 15px; margin-bottom: 8px;"><strong>Contraprestación:</strong> {precio}</div>
    <div style="font-size: 15px;"><strong>Forma de pago:</strong> {formaPago}</div>
  </div>

  <div style="margin: 24px 0;">
    <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">INCLUYE:</h3>
    <div style="padding-left: 16px;">
      {servicios}
    </div>
  </div>

  <div style="margin: 24px 0;">
    <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">REQUISITOS:</h3>
    <div style="padding-left: 16px;">
      {requisitos}
    </div>
  </div>

  <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0;">
    <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">CONTACTO:</h3>
    <div style="padding-left: 16px;">
      {contacto}
    </div>
  </div>

  <p style="margin: 24px 0;"><strong>Vigencia:</strong> {vigencia}</p>

  <p style="margin-top: 32px;">Atentamente,</p>
  <div style="font-weight: 500;">{remitente}</div>
</div>`;

    const info = extractInfoFromContent(content);

    return template
      .replace("{ciudad}", info.ciudad)
      .replace("{fecha}", info.fecha)
      .replace("{servicio}", info.servicio)
      .replace("{destinatario}", info.destinatario)
      .replace("{tratamiento}", info.tratamiento)
      .replace("{apellido}", info.apellido)
      .replace("{descripcion}", info.descripcion)
      .replace("{duracion}", info.duracion)
      .replace("{precio}", formatPrice(info.precio))
      .replace("{formaPago}", info.formaPago)
      .replace("{servicios}", formatList(info.servicios))
      .replace("{requisitos}", formatList(info.requisitos))
      .replace("{contacto}", formatContactInfo(info.contacto))
      .replace("{vigencia}", info.vigencia)
      .replace("{remitente}", info.remitente);
  }

  return content;
};

// Funciones auxiliares para el formateo
const formatPrice = (price: string): string => {
  return price.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatList = (items: string[]): string => {
  return items
    .map((item) => `<div style="margin-bottom: 8px;">• ${item}</div>`)
    .join("");
};

const formatContactInfo = (contact: ContactInfo): string => {
  const parts = [] as string[];
  if (contact.name) parts.push(`👤 ${contact.name}`);
  if (contact.phone) parts.push(`☎️ ${contact.phone}`);
  if (contact.mobile) parts.push(`📱 ${contact.mobile}`);
  if (contact.email) parts.push(`📧 ${contact.email}`);
  if (contact.web) parts.push(`🌐 ${contact.web}`);
  if (contact.address) parts.push(`🏠 ${contact.address}`);
  return parts.map(p => `<div style="margin-bottom: 8px;">${p}</div>`).join('');
};

const extractInfoFromContent = (content: string) => {
  try {
    // Valores por defecto
    const info = {
      ciudad: "Guadalajara, Jalisco",
      fecha: formatDate(new Date()),
      servicio: "",
      destinatario: "",
      tratamiento: "Sr.",
      apellido: "",
      descripcion: "",
      duracion: "",
      precio: "",
      formaPago: "",
      servicios: [] as string[],
      requisitos: [] as string[],
      contacto: {
        name: "",
        phone: "",
        mobile: "",
        email: "",
        web: "",
        address: "",
      },
      vigencia: "",
      remitente: "",
    };

    // Extraer información del contenido
    const lines = content.split("\n");

    lines.forEach((line) => {
      if (line.includes("Destinatario:")) {
        const match = line.match(/Destinatario:\s*(.+)/);
        if (match) {
          info.destinatario = match[1].trim();
          const parts = info.destinatario.split(" ");
          if (parts.length > 0) info.apellido = parts[parts.length - 1];
        }
      }
      if (line.includes("Duración:")) {
        const match = line.match(/Duración:\s*(.+)/);
        if (match) info.duracion = match[1].trim();
      }
      if (line.includes("$")) {
        const match = line.match(/\$[\d,]+(\.\d{2})?/);
        if (match) info.precio = match[0];
      }
      // ... extraer más información según sea necesario
    });

    // Extraer servicios incluidos
    const serviciosIndex = content.indexOf("INCLUYE:");
    if (serviciosIndex !== -1) {
      const serviciosSection = content.slice(serviciosIndex);
      const serviciosLines = serviciosSection.split("\n");
      info.servicios = serviciosLines
        .filter((line) => line.trim().startsWith("-"))
        .map((line) => line.trim().replace("-", "").trim());
    }

    return info;
  } catch (error) {
    console.error("Error al extraer información:", error);
    // Retornar valores por defecto en caso de error
    return {
      ciudad: "Guadalajara, Jalisco",
      fecha: formatDate(new Date()),
      servicio: "Servicio Legal",
      destinatario: "Cliente",
      tratamiento: "Sr.",
      apellido: "Cliente",
      descripcion: "Servicio legal profesional",
      duracion: "Por definir",
      precio: "$0.00",
      formaPago: "A convenir",
      servicios: ["Servicio básico"],
      requisitos: ["Documentación necesaria"],
      contacto: {
        name: "Contacto",
        phone: "(123) 456-7890",
        mobile: "",
        email: "contacto@despacho.com",
        web: "",
        address: "",
      },
      vigencia: "30 días",
      remitente: "Despacho Legal",
    };
  }
};

// ReactQuill was removed - now using SlateEditor

// Agregar esta función de limpieza
const cleanFormattingSymbols = (content: string): string => {
  // Primero limpiamos markdown y caracteres especiales
  const cleanContent = content
    .replace(/^##\s+/gm, "")           // Quitar ## de headers (inicio de línea)
    .replace(/^###\s+/gm, "")          // Quitar ### de sub-headers
    .replace(/\*\*(.*?)\*\*/g, "$1")   // Quitar ** de bold
    .replace(/\*(.*?)\*/g, "$1")       // Quitar * de italic
    .replace(/\[|\]/g, "")             // Quitar corchetes
    .replace(/_{2,}/g, "")             // Quitar guiones bajos múltiples
    .replace(/\*\*/g, "");             // Quitar ** sobrantes

  // Luego procesamos la estructura
  const sections = cleanContent.split("---").map((section) => section.trim());

  // Formateamos cada sección
  return sections
    .map((section) => {
      // Si es una lista
      if (section.includes("•")) {
        return section
          .split("•")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => `  • ${item}`)
          .join("\n");
      }

      // Si es un párrafo normal
      return section;
    })
    .join("\n\n");
};

// Agregar esta función de utilidad para formatear el texto
const formatearTexto = (content: string) => {
  // Primero limpiamos markdown y caracteres especiales
  const cleanContent = content
    .replace(/^##\s+/gm, "")           // Quitar ## de headers
    .replace(/^###\s+/gm, "")          // Quitar ### de sub-headers
    .replace(/\*\*(.*?)\*\*/g, "$1")   // Quitar ** de bold
    .replace(/\*(.*?)\*/g, "$1")       // Quitar * de italic
    .replace(/\[|\]/g, "")             // Quitar corchetes
    .replace(/_{2,}/g, "")
    .replace(/\*\*/g, "");

  // Separamos en secciones principales
  const sections = cleanContent.split(
    /(?=ENCABEZADO:|DESTINATARIO:|INTRODUCCIÓN:|SERVICIOS:|PROCESO:|COSTOS:|CIERRE:)/g,
  );

  // Procesamos cada sección
  return sections
    .map((section) => {
      const [title, ...content] = section.split("\n");
      const sectionContent = content.join("\n").trim();

      // Si es una sección con título
      if (title.includes(":")) {
        switch (true) {
          // Encabezado: formato especial para fecha y dirección
          case title.includes("ENCABEZADO"):
            return `${sectionContent.split(",").join(",\n")}`;

          // Destinatario: formato para datos de contacto
          case title.includes("DESTINATARIO"):
            // NO usar split(".") porque rompe "S.A. de C.V."
            // Mantener el contenido tal cual
            return `${title}\n${sectionContent}`;

          // Introducción: párrafo normal
          case title.includes("INTRODUCCIÓN"):
            return `${title}\n\n${sectionContent}`;

          // Servicios: lista numerada con sangría
          case title.includes("SERVICIOS"):
            return `${title}\n${sectionContent
              .split(/\d+\./)
              .map((item, i) => {
                if (i === 0) return "";
                return `  ${i}. ${item.trim()}`;
              })
              .join("\n")}`;

          // Proceso: lista con viñetas y sangría
          case title.includes("PROCESO"):
            return `${title}\n${sectionContent
              .split("•")
              .map((item) => {
                if (!item.trim()) return "";
                return `  • ${item.trim()}`;
              })
              .join("\n")}`;

          // Costos: formato tabular
          case title.includes("COSTOS"):
            return `${title}\n${sectionContent
              .split("\n")
              .map((line) => {
                if (line.includes(":")) {
                  const [label, value] = line.split(":");
                  return `  ${label.padEnd(30, " ")}: ${value.trim()}`;
                }
                return `  ${line}`;
              })
              .join("\n")}`;

          // Cierre: formato especial para firma
          case title.includes("CIERRE"):
            return `${title}\n\n${sectionContent.split("\n").join("\n\n")}`;

          default:
            return `${title}\n${sectionContent}`;
        }
      }

      return section.trim();
    })
    .join("\n\n\n")
    .replace(/\n{4,}/g, "\n\n\n"); // Limitar a máximo 3 saltos de línea
};

interface CotizacionFormProps {
  initialService?: {
    descripcion: string;
    tiempo: string;
    precio: string;
    nombre: string;
    detalles: string;
    incluye: string[];
  } | null;
}

export default function CotizacionForm({
  initialService,
}: CotizacionFormProps) {
  const { user } = useAuth();
  const [brandingInfo, setBrandingInfo] = useState<BrandingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [senderInfo, setSenderInfo] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [descripcionServicio, setDescripcionServicio] = useState(
    initialService?.descripcion || "",
  );
  const [estimacionTiempo, setEstimacionTiempo] = useState(
    initialService?.tiempo || "",
  );
  const [precio, setPrecio] = useState(initialService?.precio || "");
  const [tipoCotizacion, setTipoCotizacion] = useState<TipoCotizacion>("corta");
  const [cotizacionGenerada, setCotizacionGenerada] =
    useState<CotizacionGenerada | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [onePagerData, setOnePagerData] = useState(null);
  const [servicioCompleto, setServicioCompleto] = useState(
    initialService
      ? {
        nombre: initialService.nombre,
        descripcion: initialService.descripcion,
        detalles: initialService.detalles,
        tiempo: initialService.tiempo,
        precio: initialService.precio,
        incluye: initialService.incluye,
      }
      : null,
  );
  const [necesidadesCliente, setNecesidadesCliente] = useState("");
  const [jurisdiccion, setJurisdiccion] = useState("");
  const [requerimientos, setRequerimientos] = useState("");
  const [formaPago, setFormaPago] = useState("");
  const cotizacionRef = useRef<HTMLDivElement>(null);

  // Estado para IA de requerimientos
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiOptions, setAiOptions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Estado para IA de forma de pago
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState<string[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Estado para IA de necesidades del cliente
  const [needsModalOpen, setNeedsModalOpen] = useState(false);
  const [needsOptions, setNeedsOptions] = useState<string[]>([]);
  const [needsLoading, setNeedsLoading] = useState(false);

  // Estado para IA de estimación de tiempo
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [timeOptions, setTimeOptions] = useState<string[]>([]);
  const [timeLoading, setTimeLoading] = useState(false);

  useEffect(() => {
    const fetchBrandingInfo = async () => {
      if (!user?.uid) return;

      try {
        const docRef = doc(db, "brandingInfo", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as BrandingInfo;
          setBrandingInfo(data);
          setSenderInfo(data.slogan ? data.nombreDespacho.replace(data.slogan, '').trim() : data.nombreDespacho); // Inicializa el estado local con el valor de la BD
        }
      } catch (error) {
        console.error("Error fetching branding info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrandingInfo();
  }, [user?.uid]);

  useEffect(() => {
    if (initialService) {
      setDescripcionServicio(initialService.descripcion);
      setEstimacionTiempo(initialService.tiempo);
      setPrecio(initialService.precio);
      setServicioCompleto({
        nombre: initialService.nombre,
        descripcion: initialService.descripcion,
        detalles: initialService.detalles,
        tiempo: initialService.tiempo,
        precio: initialService.precio,
        incluye: initialService.incluye,
      });
    }
  }, [initialService]);

  // Validación del formulario
  const isFormValid = () => {
    return (
      senderInfo.trim() !== "" &&
      descripcionServicio.trim() !== "" &&
      estimacionTiempo.trim() !== "" &&
      precio.trim() !== ""
    );
  };

  const generateRequirements = async () => {
    setAiModalOpen(true);
    setAiLoading(true);
    try {
      const response = await fetch("/api/cotizacion/requerimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcionServicio,
          necesidadesCliente,
          jurisdiccion,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setAiOptions(data.options || []);
      } else {
        toast.error(data.error || "Error al generar sugerencias");
      }
    } catch (error) {
      console.error("Error generando requerimientos:", error);
      toast.error("Error al generar sugerencias");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectRequirement = (selected: string[]) => {
    setRequerimientos(selected.join("\n"));
    setAiModalOpen(false);
  };

  const generatePaymentOptions = async () => {
    setPaymentModalOpen(true);
    setPaymentLoading(true);
    try {
      const response = await fetch("/api/cotizacion/forma-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcionServicio }),
      });
      const data = await response.json();
      if (response.ok) {
        setPaymentOptions(data.options || []);
      } else {
        toast.error(data.error || "Error al generar sugerencias de pago");
      }
    } catch (error) {
      console.error("Error generando formas de pago:", error);
      toast.error("Error al generar sugerencias de pago");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSelectPayment = (selected: string) => {
    setFormaPago(selected);
    setPaymentModalOpen(false);
  };

  const generateNeeds = async () => {
    setNeedsModalOpen(true);
    setNeedsLoading(true);
    try {
      const response = await fetch("/api/cotizacion/necesidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcionServicio }),
      });
      const data = await response.json();
      if (response.ok) {
        setNeedsOptions(data.options || []);
      } else {
        toast.error(data.error || "Error al generar sugerencias de necesidades");
      }
    } catch (error) {
      console.error("Error generando necesidades:", error);
      toast.error("Error al generar sugerencias de necesidades");
    } finally {
      setNeedsLoading(false);
    }
  };

  const handleSelectNeeds = (selected: string[]) => {
    setNecesidadesCliente(selected.join("\n"));
    setNeedsModalOpen(false);
  };

  const generateTimeEstimation = async () => {
    setTimeModalOpen(true);
    setTimeLoading(true);
    try {
      const response = await fetch("/api/cotizacion/estimacion-tiempo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcionServicio }),
      });
      const data = await response.json();
      if (response.ok) {
        setTimeOptions(data.options || []);
      } else {
        toast.error(data.error || "Error al generar sugerencias de tiempo");
      }
    } catch (error) {
      console.error("Error generando estimaciones de tiempo:", error);
      toast.error("Error al generar sugerencias de tiempo");
    } finally {
      setTimeLoading(false);
    }
  };

  const handleSelectTime = (selected: string[]) => {
    setEstimacionTiempo(selected.join("\n"));
    setTimeModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const response = await fetch(
                tipoCotizacion === "corta"
          ? "/api/cotizacion/generar/corta"
          : tipoCotizacion === "onepager"
          ? "/api/cotizacion/generar/onepager"
          : "/api/cotizacion/generar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
                           tipoCotizacion !== "detallada"         
              ? {
                // Payload para cotización corta sin cambios
                clienteNombre: destinatario.trim(),
                remitente: senderInfo.trim(),
                descripcion: descripcionServicio.trim(),
                tiempo: estimacionTiempo.trim(),
                precio: precio.trim(),
                formaPago: formaPago.trim(),
                despachoInfo: {
                  nombre: brandingInfo?.nombreDespacho || "",
                  slogan: brandingInfo?.slogan || "",
                  anoFundacion: brandingInfo?.anoFundacion || "",
                },
                userInfo: {
                  displayName: user?.displayName || "",
                  despacho: brandingInfo?.nombreDespacho || "",
                },
                servicioInfo: servicioCompleto
                  ? {
                    nombre: servicioCompleto.nombre,
                    descripcion: servicioCompleto.descripcion,
                    detalles: servicioCompleto.detalles,
                    incluye: Object.entries(servicioCompleto.incluye)
                      .map(([key, value]) => ({
                        orden: key,
                        descripcion: value,
                      }))
                      .sort((a, b) => Number(a.orden) - Number(b.orden)),
                  }
                  : null,
              }
              : {
                // Payload completo para cotización detallada
                clienteNombre: destinatario.trim(),
                remitente: senderInfo.trim(),
                descripcion: descripcionServicio.trim(),
                tiempo: estimacionTiempo.trim(),
                precio: precio.trim(),
                formaPago: formaPago.trim(),
                tipoCotizacion,
                despachoInfo: {
                  nombre: brandingInfo?.nombreDespacho || "",
                  slogan: brandingInfo?.slogan || "",
                  anoFundacion: brandingInfo?.anoFundacion || "",
                },
                userInfo: {
                  displayName: user?.displayName || "",
                  despacho: brandingInfo?.nombreDespacho || "",
                },
                servicioInfo: servicioCompleto
                  ? {
                    nombre: servicioCompleto.nombre,
                    descripcion: servicioCompleto.descripcion,
                    detalles: servicioCompleto.detalles,
                    incluye: Object.entries(servicioCompleto.incluye)
                      .map(([key, value]) => ({
                        orden: key,
                        descripcion: value,
                      }))
                      .sort((a, b) => Number(a.orden) - Number(b.orden)),
                  }
                  : null,
                estructura: {
                  formato: {
                    secciones: [
                      {
                        nombre: "encabezado",
                        elementos: ["ciudad", "fecha"],
                        estilo: "separado",
                        saltoLinea: 2,
                      },
                      {
                        nombre: "destinatario",
                        elementos: ["nombre", "direccion", "contacto"],
                        estilo: "bloque",
                        saltoLinea: 2,
                      },
                      {
                        nombre: "introduccion",
                        elementos: [
                          "saludo",
                          "contexto",
                          "detalles_servicio",
                        ],
                        estilo: "parrafo",
                        saltoLinea: 2,
                      },
                      {
                        nombre: "servicios",
                        elementos: [
                          "descripcion_general",
                          "servicios_incluidos",
                        ],
                        estilo: "lista_numerada",
                        saltoLinea: 2,
                      },
                      {
                        nombre: "proceso",
                        elementos: [
                          "tiempo",
                          "responsabilidades",
                          "comunicacion",
                        ],
                        estilo: "lista_viñetas",
                        saltoLinea: 2,
                      },
                      {
                        nombre: "costos",
                        elementos: ["honorarios", "desglose", "forma_pago"],
                        estilo: "tabla",
                        saltoLinea: 2,
                      },
                      {
                        nombre: "cierre",
                        elementos: [
                          "vigencia",
                          "contacto",
                          "firma",
                          "slogan",
                        ],
                        estilo: "bloque",
                        saltoLinea: 2,
                      },
                    ],
                    formateo: {
                      precios: {
                        estilo: "moneda",
                        formato: "MXN",
                      },
                      fechas: {
                        formato: "largo",
                        locale: "es-MX",
                      },
                      listas: {
                        sangria: true,
                        espaciado: 1,
                      },
                    },
                  },
                },
              },
          ),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al generar la cotización");
      }

      const data = await response.json();


      if (tipoCotizacion === "onepager" && data?.estructurado) {
        setOnePagerData(data.estructurado);
        setCotizacionGenerada(null);
        setTimeout(() => {
          cotizacionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else if (data && data.contenido) {
        setCotizacionGenerada({
          contenido: formatearTexto(data.contenido),
        });

        // Esperar un momento para que el contenido se renderice
        setTimeout(() => {
          cotizacionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast(error.message || "Error al generar la cotización", {
        icon: "❌",
        duration: 4000,
      });
      setCotizacionGenerada({
        contenido: "",
        error:
          error.message ||
          "Hubo un error al generar la cotización. Por favor, intente nuevamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  const handleServiceSelect = (servicio: Servicio) => {
    setServicioCompleto({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      detalles: servicio.detalles,
      tiempo: servicio.tiempo,
      precio: servicio.precio,
      incluye: Object.values(servicio.incluye),
    }); // Guardamos el servicio completo
    setDescripcionServicio(servicio.descripcion);
    setEstimacionTiempo(servicio.tiempo);
    setPrecio(servicio.precio);
    autocompletarConIA(servicio);
  };

  const autocompletarConIA = async (servicio: Servicio) => {
    try {
      const response = await fetch("/api/cotizacion/autocompletar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          servicio: servicio.descripcion,
          estimacionPrevia: servicio.tiempo,
          precioAnterior: servicio.precio,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEstimacionTiempo(data.estimacionTiempo);
        setPrecio(data.precio);
      }
    } catch (error) {
      console.error("Error al obtener sugerencias de IA:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cotización Express</h1>
        <p className="mt-2 text-sm text-gray-500">
          Complete los detalles para generar una cotización personalizada
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <InputGroup
          label="Para quién es esta cotización"
          placeholder="Nombre y empresa"
          hint="Ingrese el nombre de la persona o empresa que solicita la cotización"
          value={destinatario}
          onChange={setDestinatario}
          icon={<UserIcon className="w-5 h-5" />}
        />

        <InputGroup
          label="Quién envía esta cotización"
          placeholder="Nombre del despacho o abogado"
          value={senderInfo}
          onChange={(value) => setSenderInfo(value)}
          hint="Nombre y división del abogado o despacho que envía la cotización. Puede editar este campo si necesita personalizarlo para esta cotización."
          icon={<BuildingOfficeIcon className="w-5 h-5" />}
        />

        <ServicioInput
          value={descripcionServicio}
          onManualChange={setDescripcionServicio}
          onServiceSelect={handleServiceSelect}
        />

        <InputGroup
          label="Necesidades del cliente"
          placeholder="¿Por qué el cliente necesita que esto se haga?"
          hint="Explique el contexto y las razones detrás de la solicitud"
          value={necesidadesCliente}
          onChange={setNecesidadesCliente}
          icon={<BoltIcon className="w-5 h-5" />}
        >
          <div className="flex justify-end mt-2">
            <AIButton onClick={generateNeeds} />
          </div>
        </InputGroup>

        <InputGroup
          label="Estimación de tiempo"
          placeholder="¿Cuánto tiempo tomará y si hay posibles retrasos, por qué?"
          hint="Incluya una estimación realista del tiempo necesario"
          value={estimacionTiempo}
          onChange={setEstimacionTiempo}
          icon={<ClockIcon className="w-5 h-5" />}
        >
          <div className="flex justify-end mt-2">
            <AIButton onClick={generateTimeEstimation} />
          </div>
        </InputGroup>

        <InputGroup
          label="Jurisdicción"
          placeholder="¿Dónde está sucediendo esto?"
          hint="Especifique la ubicación geográfica o jurisdicción legal relevante"
          value={jurisdiccion}
          onChange={setJurisdiccion}
          icon={<MapPinIcon className="w-5 h-5" />}
        />

        <InputGroup
          label="Requerimientos"
          placeholder="Establezca cualquier necesidad para tener éxito en este proceso, aparte del dinero"
          hint="Documentos, información o recursos necesarios"
          value={requerimientos}
          onChange={setRequerimientos}
          icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />}
        >
          <div className="flex justify-end mt-2">
            <AIButton onClick={generateRequirements} />
          </div>
        </InputGroup>

        <InputGroup
          label="Forma de pago y exhibiciones"
          placeholder="Número de pagos, forma de pago y si hay descuento por pago completo"
          hint="Detalles sobre la estructura de pagos y exhibiciones"
          value={formaPago}
          onChange={setFormaPago}
          icon={<CreditCardIcon className="w-5 h-5" />}
        >
          <div className="flex justify-end mt-2">
            <AIButton onClick={generatePaymentOptions} />
          </div>
        </InputGroup>

        <InputGroup
          label="Costo / Precio"
          placeholder="¿Cuánto va a costar?"
          hint="Monto total del servicio"
          value={precio}
          onChange={setPrecio}
          icon={<CurrencyDollarIcon className="w-5 h-5" />}
        />

        <div className="lg:col-span-3 border-t border-gray-200 pt-6 mt-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900">
              Tipo de Cotización
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Seleccione el nivel de detalle para su cotización
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {tiposCotizacion.map((tipo) => (
              <div
                key={tipo.id}
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${tipoCotizacion === tipo.id
                  ? "border-blue-500 bg-gradient-to-br from-blue-50/50 to-blue-100/50 shadow-lg scale-[1.01]"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:scale-[1.005]"
                  }`}
                onClick={() => setTipoCotizacion(tipo.id)}
              >
                {/* Indicador de selección */}
                <div
                  className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-all duration-200 ${tipoCotizacion === tipo.id
                    ? "border-blue-500 bg-blue-500 shadow-md"
                    : "border-gray-300 bg-white group-hover:border-blue-400"
                    }`}
                >
                  {tipoCotizacion === tipo.id && (
                    <div className="w-2 h-2 rounded-full bg-white mx-auto mt-1"></div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icono destacado */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${tipoCotizacion === tipo.id
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                        }`}
                    >
                      <div className="w-6 h-6">{tipo.icon}</div>
                    </div>

                    {/* Contenido de texto */}
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-lg font-semibold transition-colors duration-200 ${tipoCotizacion === tipo.id
                          ? "text-blue-900"
                          : "text-gray-900 group-hover:text-blue-900"
                          }`}
                      >
                        {tipo.label}
                      </h4>
                      <p
                        className={`text-sm mt-2 transition-colors duration-200 ${tipoCotizacion === tipo.id
                          ? "text-blue-700"
                          : "text-gray-600 group-hover:text-gray-700"
                          }`}
                      >
                        {tipo.description}
                      </p>

                      {/* Beneficios adicionales */}
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {tipo.id === "corta" ? (
                            <>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${tipoCotizacion === tipo.id
                                  ? "bg-blue-200 text-blue-800"
                                  : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                                  }`}
                              >
                                ⚡ Rápida
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${tipoCotizacion === tipo.id
                                  ? "bg-blue-200 text-blue-800"
                                  : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                                  }`}
                              >
                                📄 Concisa
                              </span>
                            </>
                          ) : (
                            <>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${tipoCotizacion === tipo.id
                                  ? "bg-blue-200 text-blue-800"
                                  : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                                  }`}
                              >
                                📋 Completa
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${tipoCotizacion === tipo.id
                                  ? "bg-blue-200 text-blue-800"
                                  : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                                  }`}
                              >
                                🎯 Profesional
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-700"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 flex justify-end pt-6">
          <button
            type="submit"
            disabled={!isFormValid() || isGenerating}
            className={`px-8 py-3 rounded-full font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${isFormValid() && !isGenerating
              ? "bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white hover:from-[#2563EB] hover:to-[#1D4ED8]"
              : "bg-gray-200 text-gray-500 cursor-not-allowed transform-none"
              } focus:outline-none`}
          >
            <SparklesIcon className="w-5 h-5" />
            {isGenerating ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generando...
              </div>
            ) : (
              "Generar Cotización"
            )}
          </button>
        </div>
      </form>

      {/* Sección de Cotización Generada */}
      {(cotizacionGenerada || isGenerating || onePagerData) && (
        <div ref={cotizacionRef} className="lg:col-span-3 mt-8">
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Cotización Generada
              </h3>
            </div>

            {isGenerating ? (
              <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-center justify-center min-h-[200px]">
                <div className="flex items-center text-gray-500">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generando su cotización...
                </div>
              </div>
            ) : onePagerData ? (
              <OnePagerView data={onePagerData} brandingColors={brandingInfo?.colores} />1
            ) : cotizacionGenerada?.error ? (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
                {cotizacionGenerada.error}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-gray-900">
                <SlateEditor
                  value={cotizacionGenerada?.contenido || ""}
                  onChange={(content) => {
                    setCotizacionGenerada(
                      (prev) =>
                        prev && {
                          ...prev,
                          contenido: content,
                        },
                    );
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      <RequirementsAIModal
        isOpen={aiModalOpen}
        loading={aiLoading}
        options={aiOptions}
        onClose={() => setAiModalOpen(false)}
        onSelect={handleSelectRequirement}
      />
      <PaymentAIModal
        isOpen={paymentModalOpen}
        loading={paymentLoading}
        options={paymentOptions}
        onClose={() => setPaymentModalOpen(false)}
        onSelect={handleSelectPayment}
      />
      <RequirementsAIModal
        isOpen={needsModalOpen}
        loading={needsLoading}
        options={needsOptions}
        onClose={() => setNeedsModalOpen(false)}
        onSelect={handleSelectNeeds}
        customTitle="Sugerencias de Necesidades del Cliente"
      />
      <RequirementsAIModal
        isOpen={timeModalOpen}
        loading={timeLoading}
        options={timeOptions}
        onClose={() => setTimeModalOpen(false)}
        onSelect={handleSelectTime}
        customTitle="Sugerencias de Tiempo Estimado"
      />
    </div>
  );
}
