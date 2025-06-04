import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

type Seccion = {
  nombre: string;
  elementos: string[];
  estilo: string;
  saltoLinea: number;
};


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Obtener la fecha actual en español
const now = new Date();
const fecha = new Intl.DateTimeFormat('es-MX', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}).format(now);

const getPromptTemplate = (data: any) => {
  const detalladaSpec = data.tipoCotizacion === 'detallada' ? `
INSTRUCCIONES PARA COTIZACIÓN DETALLADA:
- Extensión mínima: 1200-1500 palabras
- Desarrolla cada sección con claridad y profesionalismo
- Mantén un tono formal pero cercano

1. INTRODUCCIÓN
   - Saludo formal personalizado
   - Presentación breve del despacho
   - Contextualización del servicio solicitado

2. ALCANCE DEL SERVICIO
   - Descripción detallada del servicio legal
   - Objetivos específicos a alcanzar
   - Beneficios para el cliente
   - Marco legal aplicable

3. PROCESO DE TRABAJO
   - Etapas del servicio
   - Actividades principales en cada etapa
   - Entregables específicos
   - Metodología de trabajo

4. CRONOGRAMA
   - Duración total del servicio
   - Desglose de tiempos por etapa
   - Factores que podrían afectar los tiempos
   - Fechas clave y entregables

5. REQUERIMIENTOS
   - Documentación necesaria
   - Información requerida del cliente
   - Requisitos legales específicos
   - Responsabilidades del cliente

6. CONTRAPRESTACIÓN Y FORMA DE PAGO
   - Honorarios profesionales detallados
   - Estructura de pagos
   - Gastos incluidos y no incluidos
   - Condiciones de pago
   - Vigencia de la cotización

7. TÉRMINOS Y CONDICIONES
   - Alcances y limitaciones
   - Confidencialidad
   - Modificaciones al servicio
   - Causales de terminación

8. GARANTÍAS Y COMPROMISOS
   - Compromisos de servicio
   - Garantías profesionales
   - Seguimiento del caso
   - Soporte post-servicio

9. CIERRE
   - Resumen de beneficios clave
   - Información de contacto
   - Próximos pasos
   - Agradecimiento formal` 
  : data.tipoCotizacion === 'media' 
    ? '- Incluye los puntos principales con detalle moderado\n- Extensión aproximada: 400-600 palabras'
    : data.tipoCotizacion === 'corta'
    ? '- Incluye los puntos esenciales de forma concisa\n- Extensión aproximada: 200-400 palabras'
    : '- Solo incluye los detalles más básicos\n- Extensión aproximada: 100-200 palabras';

  return `
Genera una cotización profesional en español para un servicio legal usando el siguiente formato y estilo:

ESTRUCTURA BASE:
1. Inicia con "Estimado/a [nombre del cliente]:"
2. Primer párrafo: Agradecimiento e introducción
3. Cuerpo de la cotización organizado por secciones
4. Cierre profesional con datos de contacto

DATOS PARA USAR:
Cliente: ${data.clienteNombre}
Remitente: ${data.remitente}
Servicio: ${data.descripcion}
Necesidades: ${data.necesidadesCliente}
Jurisdicción: ${data.jurisdiccion}
Tiempo: ${data.tiempo}
Inversión: ${data.precio}
Forma de Pago: ${data.formaPago}
Requerimientos: ${data.requerimientos}

ESTILO Y TONO:
- Usa un tono profesional y cordial
- Estructura clara y organizada
- Párrafos concisos y bien definidos
- Lenguaje formal pero accesible

FORMATO ESPECÍFICO:
1. ENCABEZADO
   - Fecha actual
   - Referencia: Cotización de Servicios Legales

2. SALUDO
   - "Estimado/a [nombre]:"

3. INTRODUCCIÓN
   - Agradecimiento por el interés
   - Breve presentación del despacho
   - Mención del servicio solicitado

4. ALCANCE DEL SERVICIO
   - Descripción detallada
   - Objetivos principales

5. PROCESO Y METODOLOGÍA
   - Etapas del servicio
   - Cronograma estimado

6. REQUERIMIENTOS
   - Lista de documentos necesarios
   - Requisitos específicos

7. CONTRAPRESTACIÓN Y FORMA DE PAGO
   - Monto total
   - Estructura de pagos
   - Condiciones específicas

8. TÉRMINOS Y GARANTÍAS
   - Compromisos del despacho
   - Plazos de entrega

9. CIERRE
   - Vigencia de la cotización
   - Datos de contacto
   - Agradecimiento final
   - Firma profesional

${data.servicioGuardado ? `
INFORMACIÓN ADICIONAL DEL SERVICIO GUARDADO:
${JSON.stringify(data.servicioGuardado, null, 2)}
` : ''}

INSTRUCCIONES ESPECÍFICAS SEGÚN TIPO DE COTIZACIÓN:
${detalladaSpec}

Por favor, genera una cotización profesional siguiendo estas especificaciones.`;
};

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
      tipoCotizacion,
      despachoInfo,
      servicioInfo,
      estructura ,
      userInfo
    } = body;

    // Construir un prompt más detallado usando la información adicional
    const prompt = `
      Genera una cotización profesional en español para un servicio legal siguiendo estas instrucciones específicas:

      1. INFORMACIÓN BASE:
      Despacho: ${despachoInfo.nombre}
      Identidad: ${despachoInfo.slogan}
      ${despachoInfo.anoFundacion ? `Experiencia: Desde ${despachoInfo.anoFundacion}` : ''}

      2. SERVICIO A COTIZAR:
      ${servicioInfo ? `
      Nombre del Servicio: ${servicioInfo.nombre}
      
      Descripción Técnica:
      ${servicioInfo.detalles}
      
      Servicios Específicos Incluidos:
      ${servicioInfo.incluye.map((item: { descripcion: string }) => `- ${item.descripcion}`).join('\n')}
      ` : `
      Descripción: ${descripcion}
      `}

      3. INFORMACIÓN DEL CLIENTE:
      Nombre: ${clienteNombre}
      Contacto: ${remitente}
      Tiempo Estimado: ${tiempo}
      Inversión: ${precio}
      Forma de Pago: ${formaPago}

      4. FORMATO ESPECIFICO:
      Fecha: ${fecha}

      INSTRUCCIONES DE FORMATO:

      1. ESTRUCTURA DEL DOCUMENTO:
      - Usar formato profesional con espaciado claro entre secciones
      - Evitar caracteres especiales como |, -, * o #
      - Usar viñetas simples para listas (•)
      - Usar numeración para pasos secuenciales
      - Alinear precios y tablas con espacios, no con caracteres

      2. SECCIONES REQUERIDAS:
      ${estructura.formato.secciones.map((seccion: Seccion) => `
        ${seccion.nombre.toUpperCase()}:
        • Contenido: ${seccion.elementos.join(', ')}
        • Formato: ${seccion.estilo}
        • Espaciado: ${seccion.saltoLinea} líneas
      `).join('\n')}

      3. NIVEL DE DETALLE: ${tipoCotizacion === 'detallada' ? `
        - Incluir descripción exhaustiva de cada servicio
        - Detallar beneficios y alcances
        - Explicar cada etapa del proceso
        - Desglosar costos y tiempos
        - Incluir garantías y compromisos
        - Mencionar entregables específicos
      ` : `
        - Mantener información concisa pero completa
        - Enfocarse en puntos clave
        - Resumir procesos principales
        - Mostrar costos totales
      `}

      4. FORMATO ESPECÍFICO:
      - Moneda: ${estructura.formato.formateo.precios.formato}
      - Fechas: ${estructura.formato.formateo.fechas.formato}
      - Sangrías: ${estructura.formato.formateo.listas.sangria ? 'Usar sangría en listas' : 'Sin sangría'}
      - Espaciado: ${estructura.formato.formateo.listas.espaciado} línea(s) entre elementos

      5. TONO Y ESTILO:
      - Profesional pero accesible
      - Enfatizar el valor y beneficios
      - Usar lenguaje claro y preciso
      - Mantener formato consistente
      - Resaltar la experiencia del despacho
      - Incluir próximos pasos claros

      IMPORTANTE:
      - No usar markdown ni caracteres especiales de formateo
      - Mantener alineación usando espacios
      - Usar saltos de línea para separar secciones
      - Incluir todos los servicios listados
      - Mantener coherencia en el formato de precios
      - Cerrar con información de contacto clara y próximos pasos

      6. FIRMA:
      - Firma con el nombre del despacho y el nombre del usuario:
      ${despachoInfo.nombre} - ${userInfo.displayName}

      INSTRUCCIONES ESPECÍFICAS PARA COSTOS:
      
      1. FORMATO DE COSTOS:
      • Para cotización express:
        - Mostrar solo el monto total: ${precio}
        - Forma de pago: ${formaPago}
        - Usar formato simple sin tablas ni caracteres especiales
        - Ejemplo de formato:
          COSTOS:
          Inversión Total:     [monto] MXN
          Forma de Pago:       [descripción]

      2. ALINEACIÓN:
        - Usar espacios para alinear valores
        - No usar caracteres como |, -, o *
        - Mantener consistencia en el espaciado

      3. FORMATO DE MONTOS:
        - Usar formato: ${estructura.formato.formateo.precios.formato}
        - Incluir separador de miles
        - Dos decimales fijos
        - Incluir símbolo de moneda

      4. NOTAS IMPORTANTES:
        - No desglosar costos en cotización express
        - No inventar montos o conceptos adicionales
        - Mantener la información simple y clara
        - Enfocarse en el valor total y forma de pago

      Por favor, genera una cotización profesional siguiendo estas especificaciones al detalle.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "o3-mini",
    });

    return NextResponse.json({
      contenido: completion.choices[0].message.content
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al generar la cotización' },
      { status: 500 }
    );
  }
} 