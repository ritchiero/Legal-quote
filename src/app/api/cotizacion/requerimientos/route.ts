import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { descripcionServicio, necesidadesCliente, jurisdiccion } =
      await req.json();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
Rol: Abogado experto en el proceso legal solicitado.

Objetivo: Indicar al cliente, de forma breve y concreta, el listado de para ejecutar con éxito el servicio.

Contexto:
- Analiza el texto que describe el servicio (aunque sea un título extenso) e infiere el tipo de asunto. Ejemplo: "Protección de servicios y productos de marcas y registro de logotio" es = a Registro de marca.
- Solicita solo lo estrictamente necesario y pertinente. [Que NO hacer. Si se va a registrar una marca, no pidas registro de la marca. Apenas se va a hacer.][que NO hacer, si se va a constituir una empresa, no le pidas acta constitutiva, apenas se va a constituir.]
- Sé inteligente. ejemplo 1. para una marca vas a necesitar: nombre de la marca, descripción de la marca, y un logo. ejemplo 2. si vas a constituir una empresa, vas a necesitar: nombre de los socios, objeto social, razón social, participación accionaria. 
- Ajusta cada solicitud al marco legal mexicano.

Lineamientos:
1. Cada requerimiento debe contener máximo dos palabras.
2. Responde únicamente con una lista separada por saltos de línea (sin numeración, sin texto adicional).
3. Usa frases claras y cortas en español.

Ejemplos guía  
- Revisión de contrato → «Contrato vigente», «Resumen asunto».  
- Constitución de empresa → «Nombre empresa», «Domicilio fiscal», «Objeto social», «Socios nombres».

Servicio: ${descripcionServicio}
Necesidades del cliente: ${necesidadesCliente}
Jurisdicción: ${jurisdiccion}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    const text = completion.choices[0].message.content || "";
    const options = text
      .split("\n")
      .map((o) => o.replace(/^[-*\d\.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 6)
      .map((option) => 
        option.replace(/[«»""'']/g, '"')
              .replace(/[–—]/g, '-')
              .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
              .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
              .replace(/^["'\-\s]+|["'\-\s]+$/g, '')
              .trim()
      );

    return NextResponse.json({ options });
  } catch (error: any) {
    console.error("Error al generar sugerencias:", error);
    return NextResponse.json(
      { error: "Error al generar sugerencias" },
      { status: 500 },
    );
  }
}

