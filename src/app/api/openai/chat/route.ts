import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    const openai = new OpenAI({
      apiKey
    });

    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Se requiere un prompt' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-1106',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en servicios legales en México. Debes responder SOLO en formato JSON siguiendo exactamente esta estructura, sin texto adicional ni markdown.'
        },
        {
          role: 'user',
          content: `Genera un servicio legal basado en esta descripción: "${prompt}". 
          Responde con un JSON que tenga exactamente esta estructura:
          {
            "nombre": "nombre corto y profesional del servicio",
            "descripcion": "descripción breve en 2 líneas máximo",
            "detalles": "descripción detallada en 3-4 párrafos",
            "tiempo": "tiempo estimado (ej: 2-3 semanas)",
            "precio": "precio en MXN",
            "incluye": ["item1", "item2", "item3", "item4"]
          }`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;

    return new Response(
      content,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error en OpenAI:', error);
    
    let errorMessage = 'Error al procesar la solicitud';
    if (error.code === 'invalid_api_key') {
      errorMessage = 'Error de autenticación con OpenAI';
    } else if (error.code === 'insufficient_quota') {
      errorMessage = 'Cuota de API excedida';
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.message
      }),
      {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
