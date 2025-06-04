import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    const openai = new OpenAI({ apiKey });
    const { contactInfo, insertionType, currentText, replaceExisting } = await req.json();
    const mode = replaceExisting ? 'replace' : insertionType;

    // Analizar el contenido actual para dar mejor contexto
    const lower = currentText.toLowerCase();
    const hasContactInfo = lower.includes('contacto') ||
                           lower.includes('teléfono') ||
                           lower.includes('móvil') ||
                           lower.includes('email') ||
                           lower.includes('correo') ||
                           lower.includes('domicilio');

    const hasProcessInfo = lower.includes('proceso') ||
                           lower.includes('evaluación');

    const systemPrompt = `Eres un asistente especializado en generar información de contacto profesional para cotizaciones empresariales de servicios legales.

Datos de contacto proporcionados:
- Nombre: ${contactInfo.name}
- Teléfono: ${contactInfo.phone}
- Móvil: ${contactInfo.mobile}
- Email: ${contactInfo.email}
- Web: ${contactInfo.web}
- Domicilio: ${contactInfo.address}

Contexto del documento:
${hasContactInfo ? 'El documento ya contiene datos de contacto' : 'El documento no tiene datos de contacto aún'}
${hasProcessInfo ? 'El documento incluye información de procesos' : ''}
${replaceExisting ? 'El usuario desea reemplazar la información previa generada por IA.' : ''}

Instrucciones para ${
  mode === 'end'
    ? 'inserción al final'
    : mode === 'harmonic'
      ? 'inserción armónica'
      : 'reemplazo'
}:

${mode === 'end'
  ? `- Genera un párrafo final profesional con los datos de contacto
- Debe ir después de la firma/despedida como información de contacto
- Usa un tono cordial y profesional
- Incluye una frase invitando a comunicarse`
  : mode === 'harmonic'
    ? `- Genera texto que complemente la sección de contacto
- Debe integrarse naturalmente con el contenido existente
- Proporciona detalles claros y actualizados de contacto
- Mantén la coherencia con el tono del documento`
    : `- Reemplaza la información de contacto existente por un nuevo texto coherente
- Mantén el estilo profesional y directo
- Incluye los datos de contacto actualizados`}

Formato requerido:
- MÁXIMO 1-2 párrafos cortos (50-80 palabras total)
- Conciso y directo
- Solo información esencial de contacto
- En español mexicano formal
- Sin explicaciones adicionales

IMPORTANTE: Genera SOLO la información de contacto necesaria, máximo 80 palabras.

Genera ÚNICAMENTE el texto para insertar:`;

    const userPrompt = mode === 'end'
      ? `Genera información de contacto para agregar al final del documento después de la firma. Incluye los datos específicos proporcionados.`
      : mode === 'harmonic'
        ? `Genera información de contacto para integrar armónicamente dentro del texto. Debe fluir naturalmente y usar los datos proporcionados.`
        : `Reemplaza la sección de información de contacto actual con un nuevo texto que incluya los datos indicados.`;

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
    console.error('Error generating contact text:', error);
    return NextResponse.json(
      { error: 'Error al generar contenido con IA' },
      { status: 500 }
    );
  }
}
