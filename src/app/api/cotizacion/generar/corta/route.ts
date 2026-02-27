import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
      const body = await req.json();
          const {
                clienteNombre, remitente, descripcion, tiempo, precio,
                      formaPago, despachoInfo, servicioInfo, userInfo
                          } = body;

                              const now = new Date();
                                  const fecha = new Intl.DateTimeFormat('es-MX', {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                            }).format(now);
                                                const folio = `COT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

                                                    const prompt = `Eres un abogado senior especializado en redacción de propuestas comerciales para servicios legales. Tu objetivo es crear una cotización profesional, clara y persuasiva.

                                                    CONTEXTO:
                                                    Cliente: ${clienteNombre}
                                                    Despacho: ${despachoInfo.nombre}
                                                    Servicio solicitado: ${descripcion}
                                                    Tiempo estimado del trámite: ${tiempo}
                                                    Contraprestación: ${precio}
                                                    Forma de pago: ${formaPago}
                                                    Fecha: ${fecha}
                                                    Folio: ${folio}

                                                    INFORMACIÓN DE CONTACTO (incluir al final):
                                                    ${userInfo.displayName ? `Responsable: ${userInfo.displayName}` : ''}
                                                    ${userInfo.email ? `Email: ${userInfo.email}` : ''}
                                                    ${userInfo.telefono ? `Tel: ${userInfo.telefono}` : ''}
                                                    ${despachoInfo.web ? `Web: ${despachoInfo.web}` : ''}

                                                    INSTRUCCIONES DE REDACCIÓN:

                                                    **Encabezado**
                                                    Folio: ${folio}
                                                    Fecha: ${fecha}

                                                    **Título**
                                                    "PROPUESTA DE SERVICIOS LEGALES - ${descripcion.toUpperCase()}"

                                                    **PRESENTACIÓN** (2-3 líneas)
                                                    Saludo cordial dirigido a ${clienteNombre}, presentando brevemente a ${despachoInfo.nombre} y el propósito de la propuesta.

                                                    **ALCANCE DEL SERVICIO** (4-5 puntos con viñetas)
                                                    Describe con claridad y precisión los entregables específicos del servicio ${descripcion}. Usa verbos de acción. Evita ambigüedades.

                                                    **METODOLOGÍA DE TRABAJO** (3-4 pasos)
                                                    Explica el proceso paso a paso. Puede usar numeración interna pero NO numerar el título.

                                                    **VALOR AGREGADO** (2-3 puntos ESPECÍFICOS)
                                                    Destaca beneficios concretos de trabajar con ${despachoInfo.nombre}.

                                                    **CONTRAPRESTACIÓN Y CONDICIONES COMERCIALES**
                                                    - Contraprestación: ${precio}
                                                    - Tiempo estimado del trámite ante autoridad: ${tiempo}
                                                    - Forma de pago: ${formaPago}
                                                    - Vigencia de esta propuesta: 15 días naturales a partir de ${fecha}

                                                    **DATOS DE CONTACTO**
                                                    ${userInfo.displayName || despachoInfo.nombre}
                                                    ${userInfo.email ? `Email: ${userInfo.email}` : ''}
                                                    ${userInfo.telefono ? `Tel: ${userInfo.telefono}` : ''}
                                                    ${despachoInfo.web ? `Sitio web: ${despachoInfo.web}` : ''}

                                                    Cierre con despedida formal, firma del responsable y espacio para firma del cliente.

                                                    REGLAS:
                                                    - Tono profesional y confiable
                                                    - Máximo 450 palabras
                                                    - Usa markdown (##) para títulos SIN numeración
                                                    - NUNCA uses "Inversión", siempre "Contraprestación"
                                                    - Los títulos van en mayúsculas SIN número

                                                    Genera la propuesta completa.`;

                                                        const completion = await openai.chat.completions.create({
                                                              model: 'gpt-4o-mini',
                                                                    messages: [
                                                                            { role: 'system', content: 'Eres un abogado senior con más de 15 años de experiencia en redacción de propuestas comerciales para servicios legales. Tu especialidad es crear documentos profesionales, persuasivos y claros que generen confianza en los clientes.' },
                                                                                    { role: 'user', content: prompt }
                                                                                          ],
                                                                                                max_tokens: 2048,
                                                                                                    });

                                                                                                        return NextResponse.json({
                                                                                                              contenido: completion.choices[0]?.message?.content || ''
                                                                                                                  });
                                                                                                                    } catch (error: any) {
                                                                                                                        console.error('Error:', error);
                                                                                                                            return NextResponse.json(
                                                                                                                                  { error: 'Error al generar la cotización corta' },
                                                                                                                                        { status: 500 }
                                                                                                                                            );
                                                                                                                                              }
                                                                                                                                              }