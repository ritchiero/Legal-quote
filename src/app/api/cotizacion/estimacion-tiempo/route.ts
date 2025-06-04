import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { descripcionServicio } = await req.json();

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Eres un abogado especialista en servicios legales en el mercado mexicano. Basado en la descripcion del servicio, sugiere de 3 a 5 estimaciones de tiempo concisas y realistas para completarlo. Cada sugerencia debe tener maximo 4 palabras y estar separada por salto de linea, sin numeracion.\nServicio: ${descripcionServicio}`;

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
  } catch (error) {
    console.error("Error al generar estimaciones de tiempo:", error);
    return NextResponse.json(
      { error: "Error al generar sugerencias" },
      { status: 500 },
    );
  }
}
