import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });



// FunciÃÂ³n para generar folio y fecha
const generarFolioYFecha = () => {
  const now = new Date();
  const fecha = new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(now);

  const folio = `PS-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  return { fecha, folio };
};

// ====== SUB-AGENTE 1: ENCABEZADO PROFESIONAL ======
function generarEncabezado(userInfo: any, destinatario: any, despachoInfo: any, fecha: string, folio: string) {
  // Use Markdown horizontal rule instead of ASCII block
  const separador = "---";
  const despachoNombre = despachoInfo?.nombre || despachoInfo?.nombreDespacho || "Despacho Legal";
  const despachoSlogan = despachoInfo?.slogan || "";

  console.log('Ã°ÂÂÂ Generando encabezado con:', { despachoNombre, despachoSlogan, destinatario });

  return `${despachoNombre.toUpperCase()}
${despachoSlogan ? despachoSlogan : ""}

${separador}

**PROPUESTA DE SERVICIOS PROFESIONALES**

${separador}

**Referencia:**       ${folio}
**Fecha:**            ${fecha}
**Preparado para:**   ${destinatario?.nombre || "Cliente"}
**Confidencial:**     Este documento contiene informaciÃÂ³n privilegiada

${separador}`;
}

// ====== HELPER: INSTRUCCIONES DE ESTILO ======
const getStyleInstructions = (style: string) => {
  const styles: Record<string, string> = {
    'ny-biglaw': `ESTILO: NY BIGLAW (Engagement Letter Formal).
      - Estructura de carta formal con encabezado institucional
      - Secciones numeradas en MAYÃÂSCULAS: 1. SCOPE OF ENGAGEMENT, 2. PROFESSIONAL FEES, etc.
      - Lenguaje EXTREMADAMENTE FORMAL: "pursuant to", "hereinafter referred to as"
      - Tabla de fees con bordes completos para pricing
      - PÃÂ¡rrafos narrativos densos para descripciones
      - Cierre: "Very truly yours,"
      - Incluir secciÃÂ³n de aceptaciÃÂ³n con firma`,

    'silicon-valley': `ESTILO: SILICON VALLEY (Product-led, Founder-friendly).
      - Saludo casual: "Hi [First Name]," en lugar de "Dear..."
      - Lenguaje simple y directo, CERO legalese
      - Usa TABLAS limpias para pricing
      - Boxes destacados para features/beneficios
      - Bullets con ÃÂ­conos Ã¢ÂÂ para listas
      - Mencionar "founder-friendly", "no billable surprises"
      - Cierre: "Best," (casual)
      - Enfoque en VALOR y VELOCIDAD`,

    'uk-magic-circle': `ESTILO: BRITÃÂNICA (Magic Circle, Solicitors).
      - Formato de carta formal britÃÂ¡nica
      - Fecha en formato UK: "23 January 2026"
      - Referencia: "Our ref: AP/NDA/2026/0147"
      - Secciones numeradas tradicionales: 1. Background, 2. Our Understanding, 3. Scope of Work
      - Lenguaje formal britÃÂ¡nico: "We are pleased to...", "We would be grateful if..."
      - Vocabulario UK: "whilst", "shall", "herewith", "pursuant"
      - Tabla de fees con IVA/VAT explÃÂ­cito
      - Mencionar SRA number y regulatory compliance
      - Cierre: "Yours sincerely" (britÃÂ¡nico)
      - Box de "Confirmation of Instructions" para firma`,

    'german-engineering': `ESTILO: INGENIERÃÂA CONTRACTUAL (AlemÃÂ¡n, Ultra Estructurado).
      - TÃÂ­tulo principal: "ACUERDO DE PRESTACIÃÂN DE SERVICIOS"
      - InformaciÃÂ³n del expediente en tabla al inicio (NÃÂ° Expediente, Fecha, VersiÃÂ³n, etc.)
      - SecciÃÂ³n 1. DEFINICIONES con tabla de tÃÂ©rminos clave
      - MUCHAS TABLAS: para servicios, cronograma, honorarios, supuestos
      - NumeraciÃÂ³n exhaustiva: 2.1, 2.2, 3.1.1, 3.1.2, etc.
      - Cronograma con fases H-0, H-1, H-2 (Hitos)
      - Tabla de honorarios con IVA desglosado lÃÂ­nea por lÃÂ­nea
      - SecciÃÂ³n de SUPUESTOS Y PRERREQUISITOS con checkboxes
      - Box de FIRMAS en formato tabla (Por el Despacho | Por el Cliente)
      - Lista de ANEXOS al final
      - Lenguaje tÃÂ©cnico y preciso, CERO ambigÃÂ¼edad`,

    'french-cabinet': `ESTILO: CABINET FRANCÃÂS (Refinado, Narrativo).
      - Header elegante centrado con lÃÂ­neas decorativas: Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ  Ã¢ÂÂ¦  Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
      - Nombre del cabinet en mayÃÂºsculas con "Ã¢ÂÂ AVOCATS Ã¢ÂÂ"
      - Secciones con nÃÂºmeros romanos centrados: I. NUESTRA PROPUESTA, II. MODALIDADES
      - Lenguaje extremadamente refinado: "Agradecemos sinceramente la confianza..."
      - Uso de itÃÂ¡licas para ÃÂ©nfasis: "Primero", "Segundo", "Tercero"
      - PÃÂ¡rrafos largos y bien redactados (no bullets)
      - Separadores decorativos entre secciones: * * *
      - Box elegante con borde doble para el precio
      - Cierre cortÃÂ©s: "Quedamos a su disposiciÃÂ³n..."
      - "Le rogamos acepte... la expresiÃÂ³n de nuestra mÃÂ¡s distinguida consideraciÃÂ³n"
      - Box de aceptaciÃÂ³n: "Ã¢ÂÂ Bon pour accord Ã¢ÂÂ"
      - Footer con informaciÃÂ³n legal completa`,

    'spanish-boutique': `ESTILO: DESPACHO BOUTIQUE (Profesional Latinoamericano).
      - Header con nombre destacado
      - TÃÂ­tulo centrado: "PROPUESTA DE SERVICIOS PROFESIONALES"
      - Secciones numeradas en romano: I. ANTECEDENTES, II. ALCANCE, etc.
      - Lenguaje cercano: "tenemos el agrado de...", "quedamos a su disposiciÃÂ³n..."
      - Equilibrio entre calidez y autoridad tÃÂ©cnica
      - Tabla de metodologÃÂ­a con fases
      - Tabla de honorarios con IVA 16% (MÃÂ©xico)
      - Mencionar protecciÃÂ³n de datos (LFPDPPP si es MÃÂ©xico)
      - Box de ACEPTACIÃÂN DEL ENCARGO
      - Footer con informaciÃÂ³n de contacto completa
      - Usar "Nos complace", "A su entera disposiciÃÂ³n"`,

    'japanese-keigo': `ESTILO: KEIGO JAPONÃÂS (Ultra CortÃÂ©s, Estructurado).
      - Header minimalista alineado a la derecha
      - TÃÂ­tulo en caja con bordes: "PROPUESTA DE SERVICIOS"
      - TODO en tablas limpias y estructuradas
      - Tabla 1: Resumen del Servicio (Servicio, Documento, Plazo, Responsable, Honorarios)
      - Tabla 2: Alcance con numeraciÃÂ³n 2.1-2.7 (NÃÂ° | DescripciÃÂ³n | Entregable)
      - Tabla 3: Cronograma por dÃÂ­as (DÃÂ­a 0, 1, 2-3, 4, 5)
      - Tabla 4: Honorarios con impuesto al consumo
      - Tabla 5: Puntos a Confirmar con checkboxes Ã¢ÂÂ
      - Tabla 6: Condiciones (Validez, Forma pago, Confidencialidad)
      - Lenguaje extremadamente respetuoso: "Agradecemos sinceramente..."
      - Box de aceptaciÃÂ³n simple con grid 2x2
      - Footer limpio centrado`,

    'swiss-financial': `ESTILO: FINANCIAL-GRADE (Bancario Suizo, Ultra Preciso).
      - Header ultra minimalista
      - Tabla de metadata en UNA FILA: DOCUMENTO | REF | FECHA | VALIDEZ
      - Servicio destacado en caja con TOTAL grande: CHF 1'450.00
      - Desglose exhaustivo numerado 1.1-1.5 con Subtotal, Gastos admin, IVA 8.1%, Tasa cantonal
      - Fila negra final: TOTAL A PAGAR
      - Tabla de condiciones de pago: IMPORTE | PLAZO | MÃÂTODO
      - Box de datos bancarios completo (IBAN, BIC/SWIFT, etc.)
      - Supuestos con checkboxes Ã¢ÂÂ
      - Servicios opcionales en tabla
      - TÃÂ©rminos generales en tabla (Ley, JurisdicciÃÂ³n, Seguro RC)
      - Firmas en formato tabla 2 columnas
      - Footer con CHE, UID, IVA, Registro Mercantil
      - NÃÂºmeros con separador suizo: 1'450.00
      - Lenguaje bancario preciso y frÃÂ­o`,

    'legal-ops': `ESTILO: LEGAL OPS (RFP Response, Procurement-friendly).
      - Header oscuro con "SERVICE ORDER FORM"
      - Metadata grid en 4 columnas: Job Number | Issue Date | Valid Until | Version
      - Boxes para SERVICE PROVIDER | CLIENT con info completa
      - Secciones numeradas: 1. SERVICE SUMMARY, 2. SCOPE DEFINITION, etc.
      - Tabla 1: Service Summary (sin bordes gruesos, limpia)
      - SCOPE: Dos columnas con boxes verde (Ã¢ÂÂ INCLUDED) y rojo (Ã¢ÂÂ NOT INCLUDED)
      - Tabla 2: DELIVERABLES con header negro (ID | DELIVERABLE | FORMAT | DELIVERY | ACCEPTANCE)
      - Tabla 3: PRICING con header negro y fila azul para TOTAL
      - SLA metrics en grid 3x2 con boxes
      - Security & Compliance table detallada
      - Assumptions table con IDs: A1-A6
      - Payment terms table completa
      - Attachments con checkboxes
      - Authorization box azul con firmas
      - Lenguaje tipo formulario, muy estructurado`,

    'luxury-boutique': `ESTILO: LUXURY BOUTIQUE (Ultra Minimalista, Exclusivo).
      - Header: Solo el nombre (ej. "Caldwell") sin tÃÂ­tulos
      - Formato carta personal simple
      - Fecha y cliente sin formalidades
      - Re: line directa
      - TODO en primera persona: "I would be pleased to..."
      - Lenguaje premium pero directo (British spelling: "enquiry")
      - Scope en un solo pÃÂ¡rrafo fluido (no bullets, no tablas)
      - Precio mencionado casualmente: "My fee for this work is $2,400"
      - Sin secciones numeradas
      - MUCHO espacio en blanco
      - Cierre simple: "I look forward to hearing from you."
      - Firma: solo el nombre, sin tÃÂ­tulo ni cargo
      - MÃÂ¡xima simplicidad y elegancia`
  };
  return styles[style] || styles['spanish-boutique'];
};

// ====== SUB-AGENTE 2: RESUMEN EJECUTIVO ======
async function generarResumenEjecutivo(descripcionServicio: string, despachoInfo: any, tiempo: string, toneType: 'friendly' | 'formal', styleInstructions: string) {
  const toneInstruction = toneType === 'friendly'
    ? "Usa lenguaje amigable, cercano y accesible."
    : "Usa lenguaje formal, tÃÂ©cnico y profesional.";

  const prompt = `Genera un RESUMEN EJECUTIVO profesional.
${styleInstructions}

DATOS:
Despacho: ${despachoInfo?.nombre || despachoInfo?.nombreDespacho || "Despacho Legal"}
Servicio: ${descripcionServicio}
Tiempo: ${tiempo}

INSTRUCCIONES:
1. PÃÂ¡rrafo de introducciÃÂ³n.
2. DescripciÃÂ³n del valor propuesta.
3. Mencionar plazo (${tiempo}).
4. Tono: ${toneInstruction}
5. ADAPTA LA ESTRUCTURA AL ESTILO INDICADO ARRIBA.
6. PROHIBIDO: NO incluyas fechas, montos de dinero, direcciones ni nombres de socios.
7. PROHIBIDO: NO inventes datos. Usa SOLO la informaciÃÂ³n proporcionada.

Ã¢ÂÂ Ã¯Â¸Â FORMATO OBLIGATORIO:
- USA SOLO MARKDOWN (## para headers, | para tablas, ** para negrita, - para listas)
- NO USES HTML (<div>, <h3>, <table>, etc.)
- Para tablas: usa formato markdown estÃÂ¡ndar con | y ---

Genera el resumen:`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

// ====== SUB-AGENTE 3: ALCANCE DE SERVICIOS ======
async function generarAlcanceServicios(servicios: any[], styleInstructions: string) {
  const serviciosTexto = servicios.map((s: any) => `${s.nombre}: ${s.descripcion}`).join("\n");

  const prompt = `Genera la secciÃÂ³n "ALCANCE DE LOS SERVICIOS".
${styleInstructions}

SERVICIOS:
${serviciosTexto}

INSTRUCCIONES:
1. TÃÂ­tulo: "II. ALCANCE" (o el que corresponda al estilo).
2. Desarrolla las fases del servicio.
3. CRÃÂTICO: Sigue las instrucciones de estilo para el FORMATO.
4. PROHIBIDO: NO incluyas tablas de honorarios/fees ni cronogramas aquÃÂ­ (eso va en otra secciÃÂ³n).
5. PROHIBIDO: NO inventes entregables que no se deriven de la descripciÃÂ³n.
6. PROHIBIDO: NO menciones precios ni fechas especÃÂ­ficas.

Ã¢ÂÂ Ã¯Â¸Â FORMATO OBLIGATORIO:
- USA SOLO MARKDOWN (## para headers, | para tablas, ** para negrita, - para listas)
- NO USES HTML (<div>, <h3>, <table>, etc.)
- Para tablas: usa formato markdown estÃÂ¡ndar con | y ---

Genera SOLO la secciÃÂ³n de alcance:`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

// ====== SUB-AGENTE 4: CRONOGRAMA ======
async function generarCronograma(tiempo: string, descripcionServicio: string, styleInstructions: string) {
  const prompt = `Genera la secciÃÂ³n "CRONOGRAMA ESTIMADO".
${styleInstructions}

DATOS:
Tiempo total: ${tiempo}
Servicio: ${descripcionServicio}

INSTRUCCIONES:
1. Genera un plan de trabajo.
2. CRÃÂTICO: Si el estilo pide tabla, USA UNA TABLA MARKDOWN STANDARD, NO ASCII.
3. NO INVENTES FECHAS EXACTAS si no se proporcionaron. Usa tiempos relativos (Semana 1, Semana 2) o la duraciÃÂ³n total proporcionada.
   Ejemplo Markdown:
   | Fase | Actividad | Tiempo |
   | --- | --- | --- |
   | 1 | Inicio | DÃÂ­a 1 |

   NO uses caracteres como "Ã¢ÂÂ" o "Ã¢ÂÂ" ni bloques de cÃÂ³digo.

Ã¢ÂÂ Ã¯Â¸Â FORMATO OBLIGATORIO:
- USA SOLO MARKDOWN (## para headers, | para tablas, ** para negrita)
- NO USES HTML (<div>, <table>, etc.)
- Para negritas: ** no <strong>

Genera la secciÃÂ³n:`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

// ====== SUB-AGENTE 5: HONORARIOS (sin IA) ======
function generarHonorarios(precio: string, formaPago: string, moneda: string) {
  // Robust parsing: remove non-numeric chars except dot
  // If input is empty or invalid, default to 0 to avoid NaN
  const cleanPrice = precio ? precio.replace(/[^0-9.]/g, '') : '0';
  const precioNum = parseFloat(cleanPrice) || 0;

  const honorarios = precioNum / 1.16;
  const iva = precioNum - honorarios;
  const simbolo = moneda === "USD" ? "$" : "$";

  // Use toLocaleString for pretty numbers (e.g. 1,200.00)
  const fmt = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `IV. HONORARIOS PROFESIONALES

Por los servicios descritos en la presente propuesta, nuestros honorarios ascienden a:

| Concepto | Importe |
| :--- | :---: |
| Honorarios profesionales | ${simbolo}${fmt(honorarios)} ${moneda} |
| IVA (16%) | ${simbolo}${fmt(iva)} ${moneda} |
| **TOTAL** | **${simbolo}${fmt(precioNum)} ${moneda}** |

**Condiciones de pago:** ${formaPago || "Pago ÃÂºnico al completar el servicio"}

> Los honorarios no incluyen derechos notariales, derechos registrales ni gastos ante autoridades, los cuales serÃÂ¡n cubiertos directamente por el cliente o facturados por separado a precio de costo.`;
}

// ====== SUB-AGENTE 6: OBLIGACIONES Y CONFIDENCIALIDAD ======
async function generarObligacionesYCierre(despachoInfo: any, userInfo: any, styleInstructions: string) {
  const despachoNombre = despachoInfo?.nombre || despachoInfo?.nombreDespacho || "Despacho Legal";
  const telefono = despachoInfo?.telefono || despachoInfo?.phone || despachoInfo?.mobile || userInfo?.phone || userInfo?.mobile || userInfo?.telefono || "";
  const direccion = despachoInfo?.direccion || despachoInfo?.address || userInfo?.location || userInfo?.address || "";
  const email = userInfo?.email || `contacto@${despachoNombre.toLowerCase().replace(/\s/g, '')}.mx`;
  const web = despachoInfo?.web || despachoInfo?.website || userInfo?.web || userInfo?.website || "";

  const prompt = `Genera las secciones finales (V a VIII) de una propuesta legal profesional.

${styleInstructions}

DATOS:
Despacho: ${despachoNombre}
Email: ${email}
TelÃ©fono: ${telefono}
DirecciÃ³n: ${direccion}

INSTRUCCIONES:
1. Generar 4 secciones:
   - V. OBLIGACIONES DEL CLIENTE (lista de documentos/informaciÃÂ³n que debe proporcionar)
   - VI. CONFIDENCIALIDAD (pÃÂ¡rrafo sobre protecciÃÂ³n de informaciÃÂ³n)
   - VII. VIGENCIA (30 dÃÂ­as naturales)
   - VIII. ACEPTACIÃÂN (solicitud de confirmaciÃÂ³n por escrito)

2. Formato profesional y conciso
3. IMPORTANTE: Usa SOLO los datos de contacto proporcionados arriba. Si un dato esta vacio, NO lo incluyas. NUNCA inventes telefonos, direcciones o emails.
4. CRÃÂTICO: NO pidas "Estados Financieros" ni "Declaraciones Fiscales" (es excesivo e inseguro).
5. LimÃÂ­tate a documentos de identidad, constitutivos y poderes.
6. Usa letras a), b), c) para listar obligaciones.

Ã¢ÂÂ Ã¯Â¸Â FORMATO OBLIGATORIO:
- USA SOLO MARKDOWN.
- NO HTML.

Ejemplo OBLIGACIONES (CORRECTO):
a) IdentificaciÃÂ³n oficial vigente
b) Acta constitutiva (si aplica)
c) Comprobante de domicilio

Genera las 4 secciones completas (V, VI, VII, VIII):`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
  });

  let footerContent = completion.choices[0]?.message?.content?.trim() || "";
  const contactSuffix = buildContactSuffix({ telefono, email, direccion, web });
  footerContent += contactSuffix;

  return footerContent;
}

// ====== SUB-AGENTE 7: FOOTER ======
function generarFooter(despachoInfo: any, userInfo: any) {
  const separador = "---";
  const despachoNombre = despachoInfo?.nombre || despachoInfo?.nombreDespacho || "Despacho Legal";
  const email = userInfo?.email || `contacto@${despachoNombre.toLowerCase().replace(/\s/g, '')}.mx`;

  // Datos reales del despacho con fallback a userInfo
  const direccion = despachoInfo?.direccion || userInfo?.location || userInfo?.address || "";
  const telefono = despachoInfo?.telefono || userInfo?.telefono || userInfo?.phone || "";
  const web = despachoInfo?.web || despachoInfo?.website || userInfo?.web || userInfo?.website || "";

  // Bug 1: Formato de firma corregido con salto de lÃÂ­nea
  const firmaNombre = userInfo?.displayName || "Consultor Legal";
  const firmaCargo = despachoInfo?.cargo || "Socio";

  let footerContent = `
---

**Atentamente,**

${firmaNombre}
${firmaCargo}

**${despachoNombre.toUpperCase()}**`;

  const contactSuffix = buildContactSuffix({ telefono, email, direccion, web });
  footerContent += contactSuffix;

  footerContent += `

${separador}`;

  return footerContent;
}

function buildContactSuffix({ telefono, email, direccion, web }: { telefono?: string; email?: string; direccion?: string; web?: string }) {
  const contactLines = [
    direccion?.trim() ? `**Dirección:** ${direccion.trim()}` : null,
    telefono?.trim() ? `**Teléfono:** ${telefono.trim()}` : null,
    email?.trim() ? `**Email:** ${email.trim()}` : null,
    web?.trim() ? `**Web:** ${web.trim()}` : null,
  ].filter(Boolean);

  if (contactLines.length === 0) return "";

  return `

**Contacto**  
${contactLines.join('  \n')}`;
}

// ====== ORQUESTADOR PRINCIPAL ======
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      clienteNombre,
      remitente,
      descripcion,
      tiempo,
      precio,
      formaPago,
      despachoInfo,
      servicioInfo,
      estructura,
      userInfo,
      // Format & Style Configuration
      formatType,
      toneType,
      languageType,
      styleType,
      customLanguage,
      customBlocks,
      addOns
    } = body;

    // Debug: Log received branding data
    console.log('Ã°ÂÂÂ Backend received despachoInfo:', despachoInfo);
    console.log('Ã°ÂÂÂ Backend received userInfo:', userInfo);

    // Generar folio y fecha
    const { fecha, folio } = generarFolioYFecha();

    console.log("Ã°ÂÂÂ Iniciando generaciÃÂ³n con sub-agentes profesionales (Anthropic Claude)...");

        if (!process.env.OPENAI_API_KEY) {
                throw new Error("OPENAI_API_KEY is missing");
                    }
    // Preparar datos
    const safeDespachoInfo = despachoInfo
      ? {
          ...despachoInfo,
          nombre: despachoInfo?.nombre || despachoInfo?.nombreDespacho || "Despacho Legal",
        }
      : { nombre: "Despacho Legal", slogan: "" };
    const destinatario = { nombre: clienteNombre, empresa: remitente || "" };
    const moneda = estructura?.formato?.precios?.formato || 'MXN';
    const serviciosData = servicioInfo ? [servicioInfo] : [{
      nombre: descripcion,
      descripcion: descripcion,
      detalles: descripcion,
      incluye: ["Servicio completo"]
    }];

    // 1. Obtener Instrucciones de Estilo Profundo
    const styleInstructions = getStyleInstructions(styleType || 'spanish-boutique');
    console.log(`Ã°ÂÂÂ¨ Estilo seleccionado: ${styleType || 'spanish-boutique'} -> Aplicando instrucciones profundas.`);

    // Ejecutar agentes en paralelo con instrucciones de estilo
    const [resumenEjecutivo, alcanceServicios, cronograma, obligacionesYCierre] = await Promise.all([
      generarResumenEjecutivo(descripcion, safeDespachoInfo, tiempo, toneType || 'formal', styleInstructions),
      generarAlcanceServicios(serviciosData, styleInstructions),
      generarCronograma(tiempo, descripcion, styleInstructions),
      generarObligacionesYCierre(safeDespachoInfo, userInfo, styleInstructions)
    ]);

    // Generar secciones sin IA
    const encabezado = generarEncabezado(userInfo, destinatario, safeDespachoInfo, fecha, folio);
    const honorarios = generarHonorarios(precio, formaPago, moneda);
    const footer = generarFooter(safeDespachoInfo, userInfo);

    // Ensamblar documento
    console.log("Ã°ÂÂÂ¨ Ensamblando documento final...");

    let contenidoFinal = '';

    // If custom blocks are specified, generate only enabled blocks in order
    if (formatType === 'custom' && customBlocks && customBlocks.length > 0) {
      const sortedBlocks = customBlocks
        .filter((b: any) => b.enabled)
        .sort((a: any, b: any) => a.order - b.order);

      const sections = [encabezado];

      for (const block of sortedBlocks) {
        switch (block.id) {
          case 'intro':
            sections.push(`I. RESUMEN EJECUTIVO\n\n${resumenEjecutivo}`);
            break;
          case 'services':
            sections.push(alcanceServicios);
            break;
          case 'timeline':
            sections.push(cronograma);
            break;
          case 'costs':
            sections.push(honorarios);
            break;
          case 'terms':
            sections.push(obligacionesYCierre);
            break;
        }
      }

      sections.push(footer);
      contenidoFinal = sections.join('\n\n\n');

    } else {
      // Default: generate all sections
      contenidoFinal = `${encabezado.trim()}

${resumenEjecutivo.trim()}

${alcanceServicios.trim()}

${cronograma.trim()}

${honorarios.trim()}

${obligacionesYCierre.trim()}

${footer.trim()}`;
    }

    console.log("Ã¢ÂÂ CotizaciÃÂ³n profesional generada con ÃÂ©xito");

    return NextResponse.json({
      contenido: contenidoFinal,
      folio: folio
    });

  } catch (error: any) {
    console.error('Ã¢ÂÂ Error en orquestador:', error);
    return NextResponse.json(
      { error: `Error al generar la cotizaciÃÂ³n: ${error.message}` },
      { status: 500 }
    );
  }
}
