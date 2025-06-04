import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { descripcionServicio, jurisdiccion } = await req.json();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Eres un abogado experto en analizar el contexto de un servicio legal solicitado. Basado en la descripcion del servicio y la jurisdiccion, anticipa cuales son las necesidades o motivaciones reales del cliente para realizar este trámite. No incluyas frases genéricas como 'precios claros', 'buena atención', ni temas de relación cliente-abogado. Concéntrate en los motivos auténticos y relevantes al asunto, por ejemplo: crear un nuevo negocio, registrar un producto, evitar una infracción, obtener certeza jurídica, evitar recargos, etc. Cada necesidad debe tener entre 3 y 4 palabras como máximo, en lenguaje sencillo, acotado al derecho mexicano y relevante al asunto en cuestión. Responde con una lista separada por salto de linea, sin numeracion y con frases muy cortas.
Servicio: ${descripcionServicio}
Jurisdiccion: ${jurisdiccion}`;

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
    console.error("Error al generar necesidades:", error);
    return NextResponse.json(
      { error: "Error al generar sugerencias" },
      { status: 500 },
    );
  }
}
