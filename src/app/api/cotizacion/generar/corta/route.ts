import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
      userInfo
    } = body;

    // Obtener la fecha actual en español
    const now = new Date();
    const fecha = new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(now);

    const prompt = `
      Genera una cotización corta y concisa en español para un servicio legal:

      Comienza con el título: "Cotización de ${descripcion}"

      ESTRUCTURA REQUERIDA:
      1. Fecha (usa exactamente esta fecha: ${fecha})
      2. Objetivo (1 párrafo breve)
      3. Servicios (lista de 3-4 puntos clave)
      4. Proceso (2-3 puntos esenciales)
      5. Contraprestación y Forma de Pago
      6. Firma

      DATOS:
      - Cliente: ${clienteNombre}
      - Despacho: ${despachoInfo.nombre}
      - Servicio: ${descripcion}
      - Tiempo: ${tiempo}
      - Precio: ${precio}
      - Forma de Pago: ${formaPago}

      INSTRUCCIONES ESPECÍFICAS:
      - Máximo 300 palabras en total
      - Tono profesional pero conciso
      - Sin detalles técnicos extensos
      - Enfoque en beneficios clave
      - Solo puntos esenciales del proceso
      - Formato simple y directo

      IMPORTANTE:
      - No uses la palabra "Inversión", siempre usa "Contraprestación"
      - No uses caracteres especiales para formato
      - Usa viñetas simples (•) para listas
      - Espaciado simple entre secciones
      - No incluyas detalles de implementación
      - Mantén cada sección breve y directa
      - No incluyas las secciones Ciudad, Datos del Cliente, Introducción ni Cierre Breve
      - IMPORTANTE: Usa exactamente la fecha proporcionada al inicio

      FIRMA:
        Atentamente,
        ${despachoInfo.nombre} - ${userInfo.displayName}

    `;
    

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      temperature: 0.7,
    });

    return NextResponse.json({
      contenido: completion.choices[0].message.content
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al generar la cotización corta' },
      { status: 500 }
    );
  }
} 