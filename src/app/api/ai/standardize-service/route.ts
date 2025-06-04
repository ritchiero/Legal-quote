import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { nombre, descripcion, detalles, tiempo, precio, incluye } = await request.json();

    const prompt = `
Actúa como un experto en servicios legales y estandariza la siguiente información de servicio para que sea profesional, consistente y clara:

DATOS ACTUALES:
- Nombre: ${nombre}
- Descripción: ${descripcion}
- Detalles: ${detalles}
- Tiempo: ${tiempo}
- Incluye: ${Array.isArray(incluye) ? incluye.join(', ') : incluye}

INSTRUCCIONES DE ESTANDARIZACIÓN:
1. **Nombre**: Máximo 60 caracteres, claro y profesional (ej: "Constitución de Sociedad Anónima")
2. **Descripción**: 80-120 caracteres, resumiendo el valor principal del servicio
3. **Detalles**: 200-300 caracteres, explicación completa pero concisa del servicio y sus beneficios
4. **Tiempo**: Formato estándar (ej: "2-3 semanas", "1-2 meses", "3-5 días hábiles")
5. **Incluye**: Lista de 3-5 elementos clave que incluye el servicio, cada uno de 20-40 caracteres

RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO CON ESTA ESTRUCTURA:
{
  "nombre": "Nombre estandarizado",
  "descripcion": "Descripción estandarizada",
  "detalles": "Detalles estandarizados",
  "tiempo": "Tiempo estandarizado",
  "incluye": ["Item 1", "Item 2", "Item 3", "Item 4"]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Eres un experto en servicios legales que estandariza información para que sea profesional y consistente. Responde únicamente con JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No se recibió respuesta de la IA');
    }

    try {
      const standardizedService = JSON.parse(content);
      return NextResponse.json(standardizedService);
    } catch (parseError) {
      console.error('Error parsing AI response:', content);
      throw new Error('Respuesta inválida de la IA');
    }

  } catch (error) {
    console.error('Error en estandarización:', error);
    return NextResponse.json(
      { error: 'Error al estandarizar servicio' },
      { status: 500 }
    );
  }
} 