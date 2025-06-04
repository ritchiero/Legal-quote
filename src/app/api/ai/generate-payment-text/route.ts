import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    const openai = new OpenAI({ apiKey });
    const { methodInfo, insertionType, currentText, isReplacement } = await req.json();

    // Analizar el contenido actual para dar contexto mejor
    const hasPaymentInfo = currentText.toLowerCase().includes('pago') || 
                          currentText.toLowerCase().includes('costo') ||
                          currentText.toLowerCase().includes('precio') ||
                          currentText.toLowerCase().includes('contraprestación');
    
    const hasProcessInfo = currentText.toLowerCase().includes('proceso') ||
                          currentText.toLowerCase().includes('evaluación');
    
    const systemPrompt = `Eres un asistente especializado en generar información de pago profesional para cotizaciones empresariales de servicios legales.

${isReplacement ? '🔄 MODO REEMPLAZO: Estás actualizando información de pago existente.' : '✨ MODO NUEVA INSERCIÓN: Estás agregando información de pago nueva.'}

Método de pago seleccionado:
- Tipo: ${methodInfo.type}
- Datos: ${methodInfo.displayName}
- Detalles adicionales: ${JSON.stringify(methodInfo.details)}

Contexto del documento:
${hasPaymentInfo ? 'El documento ya contiene información de pagos/costos' : 'El documento no tiene información de pagos aún'}
${hasProcessInfo ? 'El documento incluye información de procesos' : ''}

Instrucciones para ${insertionType === 'end' ? 'inserción al final' : 'inserción armónica'}:

${insertionType === 'end' 
  ? `- Genera un párrafo final profesional con los datos de pago
- Debe ir después de la firma/despedida como información adicional
- Incluye instrucciones claras sobre cómo realizar el pago
- Usa un tono cordial pero ejecutivo
- Incluye una frase de agradecimiento` 
  : `- Genera texto que complemente la sección de contraprestación/forma de pago
- Debe integrarse naturalmente con el contenido existente
- Proporciona detalles específicos del método de pago seleccionado
- Mantén la coherencia con el tono del documento
- Incluye términos y condiciones de pago si es apropiado`
}

Formato requerido:
- MÁXIMO 1-2 párrafos cortos (50-80 palabras total)
- Conciso y directo
- Solo información esencial de pago
- En español mexicano formal
- Sin explicaciones adicionales

IMPORTANTE: ${isReplacement ? 
  'Como estás reemplazando contenido existente, asegúrate de que el nuevo texto sea completo y autosuficiente.' 
  : 'Este es contenido nuevo que se agregará al documento existente.'
}

Genera ÚNICAMENTE el texto para insertar:`;

    const userPrompt = insertionType === 'end' 
      ? `Genera información de pago para agregar al final del documento después de la firma. Incluye los datos específicos del método de pago y instrucciones claras para el cliente.`
      : `Genera información de pago para integrar armónicamente en la sección de contraprestación. El texto debe fluir naturalmente con el contenido existente y proporcionar detalles específicos del método de pago.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.4,
      max_tokens: 150,
    });

    const generatedText = completion.choices[0].message.content || '';

    return NextResponse.json({ 
      generatedText: generatedText.trim(),
      success: true 
    });

  } catch (error: any) {
    console.error('Error generating payment text:', error);
    return NextResponse.json(
      { error: 'Error al generar contenido con IA' },
      { status: 500 }
    );
  }
} 