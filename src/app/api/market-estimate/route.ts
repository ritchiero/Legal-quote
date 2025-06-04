import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Mover las constantes a variables de entorno
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables');
}

if (!PERPLEXITY_API_KEY) {
  throw new Error('PERPLEXITY_API_KEY is not defined in environment variables');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';


const openAIPrompt = `Eres un experto en servicios legales en México. Tu tarea es reformular preguntas sobre costos de servicios legales para obtener respuestas más completas y precisas.

La pregunta reformulada debe:
1. Especificar que es para el mercado mexicano
2. Solicitar rangos de precios específicos
3. Pedir información sobre costos adicionales (derechos, impuestos, etc.)
4. Incluir factores que pueden afectar el precio
5. Mantener un tono profesional y técnico

Ejemplo:
Usuario: "Cuanto cobran los abogados por registrar una marca"
Respuesta: "Necesito saber en el mercado mexicano, cuáles son los rangos de precios en materia de honorarios que cobra un abogado especialista en la materia de propiedad intelectual por sus servicios de registro de marca. Dame mínimos y máximos de mercado, y potenciales costos como derechos o pagos no relacionados a honorarios. Incluye también factores que pueden afectar el precio final."

Reformula la siguiente pregunta siguiendo estos criterios:`;

const perplexitySystemPrompt = `Eres un analista experto en el mercado legal mexicano. 
IMPORTANTE: Tu respuesta debe ser ÚNICAMENTE un objeto JSON válido con esta estructura exacta (sin texto adicional):

{
  "rangosHonorarios": {
    "minimo": "string con el monto mínimo",
    "promedio": "string con el monto promedio",
    "maximo": "string con el monto máximo"
  },
  "costosGubernamentales": [
    {
      "concepto": "string (nombre del costo)",
      "monto": "string (monto)",
      "fuente": {
        "nombre": "string (nombre de la fuente oficial)",
        "url": "string (URL de la fuente)",
        "fechaActualizacion": "string (fecha de última actualización)"
      }
    }
  ],
  "factores": [
    "string (factor que influye en el precio)"
  ],
  "fuentesOficiales": [
    {
      "nombre": "string (nombre de la fuente)",
      "url": "string (URL de la fuente)",
      "descripcion": "string (breve descripción)"
    }
  ],
  "analisisDetallado": "string (HTML con el análisis completo)"
}`;

const perplexitySystemPromptTiposCobro = `Eres un experto en servicios legales en México. 
IMPORTANTE: Tu respuesta debe ser ÚNICAMENTE un objeto JSON válido con esta estructura exacta (sin texto adicional):

{
  "tiposCobro": [
    {
      "nombre": "nombre del tipo de cobro",
      "descripcion": "descripción breve",
      "rangoPrecios": "rango de precios típico",
      "frecuencia": "común"
    }
  ]
}`;

// Add this helper function before the POST handler
function cleanJsonResponse(text: string): string {
  // Remove markdown code block syntax if present
  return text.replace(/```json\n?|\n?```/g, '').trim();
}

export async function POST(request: Request) {
  try {
    
    // Verificar método
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Método no permitido', details: `Se esperaba POST, se recibió ${request.method}` },
        { status: 405 }
      );
    }

    // Verificar body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Error al procesar el body', details: 'El body debe ser un JSON válido' },
        { status: 400 }
      );
    }
    
    
    const { query } = body;
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query inválida', details: 'La query es requerida y debe ser un string' },
        { status: 400 }
      );
    }

    // Llamada a OpenAI
    let openAIResponse;
    try {
      openAIResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: openAIPrompt },
          { role: "user", content: query }
        ],
        temperature: 0.7,
      });
    } catch (error) {
      console.error('Error en llamada a OpenAI:', error);
      return NextResponse.json(
        { error: 'Error al comunicarse con OpenAI', details: error instanceof Error ? error.message : 'Error desconocido' },
        { status: 500 }
      );
    }

    const refinedQuery = openAIResponse.choices[0].message.content;

    // Hacer las dos llamadas a Perplexity en paralelo
    let analisisGeneral, tiposCobro;
    try {
      const [analisisResponse, tiposCobroResponse] = await Promise.all([
        // Primera llamada para el análisis general
        fetch(PERPLEXITY_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
              { role: 'system', content: perplexitySystemPrompt },
              { role: 'user', content: refinedQuery }
            ],
            max_tokens: 4000,
            temperature: 0.7,
          }),
        }),

        // Segunda llamada específica para tipos de cobro
        fetch(PERPLEXITY_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
              { role: 'system', content: perplexitySystemPromptTiposCobro },
              { role: 'user', content: `Analiza los tipos de cobro para: ${query}` }
            ],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        })
      ]);

      // Verificar si las respuestas son exitosas
      if (!analisisResponse.ok || !tiposCobroResponse.ok) {
        const analisisError = await analisisResponse.text();
        const tiposCobroError = await tiposCobroResponse.text();
        console.error('Error en respuestas de Perplexity:', { analisisError, tiposCobroError });
        return NextResponse.json(
          { 
            error: 'Error en las respuestas de Perplexity API',
            details: {
              analisisError,
              tiposCobroError
            }
          },
          { status: 500 }
        );
      }

      // Parsear las respuestas JSON
      analisisGeneral = await analisisResponse.json();
      tiposCobro = await tiposCobroResponse.json();

    } catch (error) {
      console.error('Error en las llamadas a Perplexity:', error);
      return NextResponse.json(
        { error: 'Error al comunicarse con Perplexity API', details: error instanceof Error ? error.message : 'Error desconocido' },
        { status: 500 }
      );
    }

    // Verificar si las respuestas tienen el formato esperado
    if (!analisisGeneral?.choices?.[0]?.message?.content || !tiposCobro?.choices?.[0]?.message?.content) {
      console.error('Respuestas incompletas:', { analisisGeneral, tiposCobro });
      return NextResponse.json(
        { error: 'Respuestas incompletas de Perplexity API', details: 'Falta contenido en las respuestas' },
        { status: 500 }
      );
    }


    let analisisResponse, tiposCobroResponse;
    try {
      // Clean the responses before parsing
      const cleanAnalisisText = cleanJsonResponse(analisisGeneral.choices[0].message.content);
      const cleanTiposCobroText = cleanJsonResponse(tiposCobro.choices[0].message.content);
      
      analisisResponse = JSON.parse(cleanAnalisisText);
      tiposCobroResponse = JSON.parse(cleanTiposCobroText);
    } catch (parseError) {
      console.error('Error parseando respuestas:', parseError);
      console.error('Raw analisis response:', analisisGeneral.choices[0].message.content);
      console.error('Raw tipos cobro response:', tiposCobro.choices[0].message.content);
      return NextResponse.json(
        { error: 'Error en formato de respuesta', details: parseError instanceof Error ? parseError.message : 'Error al parsear JSON' },
        { status: 500 }
      );
    }

    // Validar la estructura de la respuesta
    if (!analisisResponse.rangosHonorarios || 
        !Array.isArray(analisisResponse.costosGubernamentales) ||
        !Array.isArray(analisisResponse.factores)) {
      console.error('Estructura inválida en analisisResponse:', analisisResponse);
      return NextResponse.json(
        { error: 'Respuesta del análisis con estructura inválida', details: 'Faltan campos requeridos en la respuesta' },
        { status: 500 }
      );
    }

    if (!Array.isArray(tiposCobroResponse.tiposCobro)) {
      console.error('Estructura inválida en tiposCobroResponse:', tiposCobroResponse);
      return NextResponse.json(
        { error: 'Respuesta de tipos de cobro con estructura inválida', details: 'El campo tiposCobro debe ser un array' },
        { status: 500 }
      );
    }

    // Formatear la respuesta final con valores por defecto
    const formattedResponse = {
      refinedQuery,
      tiposCobro: tiposCobroResponse.tiposCobro || [],
      rangosHonorarios: {
        minimo: analisisResponse.rangosHonorarios.minimo || 'No especificado',
        promedio: analisisResponse.rangosHonorarios.promedio || 'No especificado',
        maximo: analisisResponse.rangosHonorarios.maximo || 'No especificado'
      },
      costosGubernamentales: analisisResponse.costosGubernamentales || [],
      factores: analisisResponse.factores || [],
      html: analisisResponse.analisisDetallado || 'No se pudo generar el análisis detallado'
    };

    return NextResponse.json(formattedResponse);

  } catch (error) {
    console.error('Error procesando respuestas:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la solicitud',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 