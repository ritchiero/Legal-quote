import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextResponse } from 'next/server';

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
                                                    Describe con claridad y precisión los entregables específicos del servicio ${descripcion}. Usa verbos de acción (elaborar, revisar, analizar, asesorar). Evita ambigüedades.

                                                    **METODOLOGÍA DE TRABAJO** (3-4 pasos)
                                                    Explica el proceso paso a paso desde el inicio hasta la conclusión del servicio. Puede usar numeración interna (1., 2., 3.) para los pasos, pero NO numerar el título.

                                                    **VALOR AGREGADO** (2-3 puntos ESPECÍFICOS)
                                                    Destaca beneficios concretos y medibles de trabajar con ${despachoInfo.nombre}. Evita generalidades. Ejemplos: "Más de 10 años de experiencia", "95% de tasa de éxito", "Respuesta garantizada en 24 horas".

                                                    **CONTRAPRESTACIÓN Y CONDICIONES COMERCIALES**
                                                    - Contraprestación: ${precio}
                                                    - Tiempo estimado del trámite ante autoridad: ${tiempo}
                                                    - Forma de pago: ${formaPago}
                                                    - Vigencia de esta propuesta: 15 días naturales a partir de ${fecha}

                                                    **DATOS DE CONTACTO**
                                                    Para cualquier duda o aclaración:
                                                    ${userInfo.displayName || despachoInfo.nombre}
                                                    ${userInfo.email ? `Email: ${userInfo.email}` : ''}
                                                    ${userInfo.telefono ? `Tel: ${userInfo.telefono}` : ''}
                                                    ${despachoInfo.web ? `Sitio web: ${despachoInfo.web}` : ''}

                                                    ---

                                                    IMPORTANTE: El cierre NO lleva número ni título. Es una despedida formal natural:
                                                    Quedamos a sus órdenes para cualquier aclaración.

                                                    Atentamente,

                                                    _________________________
                                                    ${userInfo.displayName || 'Firma del responsable'}
                                                    ${despachoInfo.nombre}

                                                    Fecha: ______________

                                                    _________________________
                                                    Firma de conformidad del cliente
                                                    Nombre: ______________
                                                    Fecha: ______________

                                                    REGLAS ESTRICTAS:
                                                    - Tono profesional, ejecutivo y confiable
                                                    - Lenguaje jurídico preciso pero accesible
                                                    - Máximo 450 palabras
                                                    - Usa formato markdown (##) para títulos pero SIN numeración antes del título
                                                    - INCORRECTO: "## 1. PRESENTACIÓN"
                                                    - CORRECTO: "## PRESENTACIÓN"
                                                    - NUNCA uses "Inversión", siempre "Contraprestación"
                                                    - Enfócate en el valor y resultados para el cliente
                                                    - Sé específico, evita generalidades
                                                    - Incluye el folio en el encabezado
                                                    - NO repitas el nombre del despacho en la firma (solo una vez)
                                                    - Clarifica que el tiempo es "del trámite" no de entrega de propuesta
                                                    - Incluye TODOS los datos de contacto proporcionados
                                                    - CRÍTICO: El cierre NO lleva número ni título markdown, es despedida natural
                                                    - Incluye espacio para firma del cliente y del responsable
                                                    - Los títulos de sección van en mayúsculas SIN número: PRESENTACIÓN, ALCANCE DEL SERVICIO, etc.

                                                    Genera ahora la propuesta completa siguiendo esta estructura.`;

                                                        const result = await generateText({
                                                              model: anthropic("claude-3-5-sonnet-20240620"),
                                                                    system: "Eres un abogado senior con más de 15 años de experiencia en redacción de propuestas comerciales para servicios legales. Tu especialidad es crear documentos profesionales, persuasivos y claros que generen confianza en los clientes.",
                                                                          prompt: prompt,
                                                                                maxTokens: 2048,
                                                                                    });

                                                                                        return NextResponse.json({
                                                                                              contenido: result.text
                                                                                                  });
                                                                                                    } catch (error: any) {
                                                                                                        console.error('Error:', error);
                                                                                                            return NextResponse.json(
                                                                                                                  { error: 'Error al generar la cotización corta' },
                                                                                                                        { status: 500 }
                                                                                                                            );
                                                                                                                              }
                                                                                                                              }