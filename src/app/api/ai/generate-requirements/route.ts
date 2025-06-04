import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    const openai = new OpenAI({ apiKey });
    const { currentText } = await req.json();

    // Analizar el contenido para dar contexto
    const isLegalService = currentText.toLowerCase().includes('legal') || 
                          currentText.toLowerCase().includes('jurídico') ||
                          currentText.toLowerCase().includes('derecho') ||
                          currentText.toLowerCase().includes('abogado');
    
    const isTechService = currentText.toLowerCase().includes('sistema') ||
                         currentText.toLowerCase().includes('tecnología') ||
                         currentText.toLowerCase().includes('software') ||
                         currentText.toLowerCase().includes('desarrollo');
    
    const isConsultingService = currentText.toLowerCase().includes('consultoría') ||
                               currentText.toLowerCase().includes('consultor') ||
                               currentText.toLowerCase().includes('asesoría');

    const systemPrompt = `Eres un Abogado. Tu tarea es generar una lista concisa de requerimientos que un proveedor de servicios profesionales debería solicitar a su cliente.

Contenido de la cotización para analizar:
"${currentText.substring(0, 1000)}..."

Contexto detectado:
${isLegalService ? '- Servicio legal/jurídico identificado' : ''}
${isTechService ? '- Servicio tecnológico identificado' : ''}
${isConsultingService ? '- Servicio de consultoría identificado' : ''}


INSTRUCCIONES ESPECÍFICAS:
1. Genera EXACTAMENTE entre 6-10 requerimientos
2. Cada requerimiento debe ser MÁXIMO 4 palabras
3. Enfócate en lo que el CLIENTE debe proporcionar al PROVEEDOR DE SERVICIOS que es necesario para  la prestación del servicio
4. Los requerimientos deben ser específicos y legales para el tipo de servicio detectado
5. Usa terminología profesional pero simple
6. En español mexicano formal y legal

EJEMPLOS del formato esperado:
- "Identificación (ID) del cliente"
- "Razón social de la empresa"
- "Datos de contacto del cliente"
- "Documentación existente"
- "Pruebas existentes"

IMPORTANTE: 
- Solo palabras esenciales (máximo 4 por requerimiento)
- No usar artículos innecesarios
- Son procesos legales y la petición tiene que venir de un abogado
- Enfocarse en elementos tangibles y específicos
- Considerar el flujo típico del tipo de proyecto identificado

Responde ÚNICAMENTE con un array JSON de strings, sin explicaciones adicionales.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: 'Analiza el contenido de la cotización y genera los requerimientos apropiados.'
        }
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    const generatedResponse = completion.choices[0].message.content || '';
    
    // Intentar parsear la respuesta como JSON
    let requirements: string[] = [];
    try {
      requirements = JSON.parse(generatedResponse);
      
      // Validar que sea un array de strings
      if (!Array.isArray(requirements) || !requirements.every(req => typeof req === 'string')) {
        throw new Error('Invalid format');
      }
      
      // Limpiar caracteres especiales de cada requerimiento
      requirements = requirements.map((req) => 
        req.replace(/[«»""'']/g, '"')
           .replace(/[–—]/g, '-')
           .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
           .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
           .replace(/^["'\-\s]+|["'\-\s]+$/g, '')
           .trim()
      );
      
      // Asegurar que tengamos entre 8-10 elementos
      if (requirements.length < 8) {
        // Agregar algunos requerimientos genéricos si hay muy pocos
        const genericReqs = ['Información detallada', 'Documentos previos', 'Contacto designado', 'Horarios específicos'];
        requirements = [...requirements, ...genericReqs].slice(0, 10);
      } else if (requirements.length > 10) {
        requirements = requirements.slice(0, 10);
      }
      
    } catch (parseError) {
      // Fallback: extraer elementos de la respuesta de texto
      console.warn('Error parsing AI response, using fallback:', parseError);
      const lines = generatedResponse.split('\n');
      requirements = lines
        .filter(line => line.trim().startsWith('"') || line.trim().startsWith('-'))
        .map(line => line.replace(/^[\s\-"]*/, '').replace(/["]*$/, '').trim())
        .filter(req => req.length > 0 && req.length < 50)
        .slice(0, 10);
      
      // Limpiar caracteres especiales también en el fallback
      requirements = requirements.map((req) => 
        req.replace(/[«»""'']/g, '"')
           .replace(/[–—]/g, '-')
           .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
           .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
           .replace(/^["'\-\s]+|["'\-\s]+$/g, '')
           .trim()
      );
      
      // Si aún no tenemos suficientes, usar un set mínimo
      if (requirements.length < 8) {
        requirements = [
          'Información completa', 'Documentos existentes', 'Contacto técnico',
          'Accesos necesarios', 'Horarios disponibles', 'Criterios específicos',
          'Material de referencia', 'Reuniones programadas', 'Feedback continuo', 'Validación final'
        ].slice(0, 10);
      }
    }

    return NextResponse.json({ 
      requirements,
      success: true 
    });

  } catch (error: any) {
    console.error('Error generating requirements:', error);
    return NextResponse.json(
      { error: 'Error al generar requerimientos con IA' },
      { status: 500 }
    );
  }
} 