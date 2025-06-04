import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { descripcionServicio } = await req.json();

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Eres un abogado especialista en contratos de servicios en el mercado legal mexicano. Sugiere de 3 a 5 opciones de formas de pago y exhibiciones, cada una con un máximo de 4 palabras, claras, sin tecnicismos y diferentes entre sí (por ejemplo: 'Pago único', '50% inicial, 50% entrega', 'Mensualidades fijas', etc). Responde con frases muy cortas en una lista separada por salto de línea, sin numeración.
Servicio: ${descripcionServicio}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message.content || "";
    const options = text
      .split("\n")
      .map((o) => o.replace(/^[-*\d\.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 5);

    return NextResponse.json({ options });
  } catch (error: any) {
    console.error("Error al generar sugerencias:", error);
    return NextResponse.json(
      { error: "Error al generar sugerencias" },
      { status: 500 },
    );
  }
}
