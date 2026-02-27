import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clienteNombre, remitente, descripcion, tiempo, precio, formaPago, despachoInfo, servicioInfo, userInfo } = body;

    const now = new Date();
    const fecha = new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }).format(now);
    const folio = `COT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    const prompt = `Genera una cotizacion de servicios legales en formato JSON estructurado. La respuesta debe ser SOLAMENTE un JSON valido, sin texto adicional ni markdown.

DATOS:
- Cliente: ${clienteNombre || 'Cliente'}
- Despacho: ${despachoInfo?.nombre || remitente || 'Despacho Legal'}
- Servicio: ${descripcion}
- Tiempo estimado: ${tiempo}
- Precio: ${precio}
- Forma de pago: ${formaPago || 'A convenir'}
- Fecha: ${fecha}
- Folio: ${folio}
- Responsable: ${userInfo?.displayName || ''}

ESTRUCTURA JSON REQUERIDA:
{
  "folio": "string",
  "fecha": "string",
  "despacho": {
    "nombre": "string",
    "responsable": "string"
  },
  "cliente": {
    "nombre": "string",
    "empresa": "string o vacio"
  },
  "titulo": "string - titulo corto del servicio",
  "servicios": [
    {
      "descripcion": "string - descripcion concisa del servicio incluido",
      "precio": "string - precio formateado o incluido"
    }
  ],
  "subtotal": "string - monto formateado",
  "iva": "string - 16% del subtotal formateado",
  "total": "string - total con IVA formateado",
  "condiciones": {
    "vigencia": "string - ej: 15 dias naturales",
    "formaPago": "string",
    "tiempoEstimado": "string"
  },
  "notas": "string - nota breve profesional"
}

REGLAS:
- Genera entre 3 y 6 servicios desglosados del servicio principal
- Los precios deben sumar el total indicado (${precio})
- Usa formato de moneda mexicana ($ con comas)
- El titulo debe ser profesional y conciso
- Las descripciones deben ser claras y especificas para servicios legales
- NUNCA uses la palabra "Inversion", usa "Contraprestacion" o "Honorarios"
- Responde SOLAMENTE con el JSON, sin backticks ni markdown`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un abogado senior especializado en cotizaciones de servicios legales. Respondes SOLAMENTE con JSON valido, sin texto adicional, sin backticks, sin markdown.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '{}';
    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { error: 'Error parsing JSON', raw };
    }

    return NextResponse.json({ contenido: JSON.stringify(parsed), estructurado: parsed });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al generar la cotizacion one pager' },
      { status: 500 }
    );
  }
}