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
Rol: Abogado experto en el trámite solicitado.

Objetivo: Indicar al cliente, de forma breve y concreta, la información o documentos indispensables para ejecutar con éxito el servicio.

Contexto:
- Analiza el texto que describe el servicio (aunque sea un título extenso) e infiere el tipo de asunto.
- Solicita solo lo estrictamente necesario y pertinente.
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
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
    });
    const text = completion.choices[0].message.content || "";
    const options = text
      .split("\n")
      .map((o) => o.replace(/^[-*\d\.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 6);

    return NextResponse.json({ options });
  } catch (error: any) {
    console.error("Error al generar sugerencias:", error);
    return NextResponse.json(
      { error: "Error al generar sugerencias" },
      { status: 500 },
    );
  }
}
