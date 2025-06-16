import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  try {
    // Intentar conectar con el nuevo backend
    const ultimoMensaje = messages[messages.length - 1]?.content || ""

    const backendResponse = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true", // Header para evitar la página de advertencia de ngrok
      },
      body: JSON.stringify({
        message: ultimoMensaje,
        max_results: 3,
      }),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()

      if (data.response) {
        // Crear un stream con la respuesta del backend
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            const chunks = data.response.split(" ")
            let index = 0

            const sendChunk = () => {
              if (index < chunks.length) {
                const chunk = chunks[index] + (index < chunks.length - 1 ? " " : "")
                controller.enqueue(encoder.encode(`0:"${chunk}"\n`))
                index++
                setTimeout(sendChunk, 50)
              } else {
                controller.enqueue(encoder.encode('d:""\n'))
                controller.close()
              }
            }

            sendChunk()
          },
        })

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Vercel-AI-Data-Stream": "v1",
          },
        })
      }
    }

    throw new Error("Backend no disponible")
  } catch (error) {
    console.error("Error conectando con backend:", error)

    // Solo si el backend no está disponible, usar DeepSeek con la información real del museo
    const deepseek = createOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      baseURL: "https://api.deepseek.com",
    })

    const contextInfo = `
INFORMACIÓN DEL MUSEO DE ARTE CONTEMPORÁNEO (MAC) LIMA:

ZONAS DEL MUSEO:
- Zona IAC: Alberga obras del Instituto de Arte Contemporáneo (1955-1972), pionero en difundir arte moderno europeo y estadounidense en Perú.
- Zona Radicalidad y resistencia: Exhibe obras que cuestionan valores estéticos tradicionales y visibilizan identidades marginadas.
- Zona Referente y Postmodernidad: Obras post-1980 que usan serigrafía y apropiación de imágenes de cultura popular.
- Zona Centro: Espacio central con pintura, fotografía, instalación y videoarte que refleja fracturas sociales peruanas.

OBRAS PRINCIPALES:
1. "El mundo en llamas" - Fernando Bryce (Zona: Referente y Postmodernidad)
   - Instalación de 95 dibujos en tinta
   - Crítica a la construcción histórica mediante reproducción de periódicos de la Segunda Guerra Mundial
   - Usa 'método de análisis mimético' para deconstruir discursos de poder

2. "Shao Kené 5" - Sara Flores (Zona: Radicalidad y resistencia)
   - Pintura con pigmentos naturales (huito)
   - Reinterpretación contemporánea de diseños geométricos Shipibo-Konibo
   - Simboliza cosmovisión amazónica y resistencia cultural

3. "Retablo Ayacuchano" - Joaquín López Antay (Zona: Centro)
   - Escultura en madera con masa de papa
   - Representa sincretismo cultural con escenas religiosas/costumbristas
   - Premio Nacional de Artes 1975, generó debate sobre arte popular

4. "Vertical celeste" - Jorge Eduardo Eielson (Zona: IAC)
   - Instalación con luz y arena
   - Inspirado en quipus y astrología andina
   - Conecta Alfa Centauro con herencia precolombina, explorando arte conceptual
`

    const systemPrompt = `Eres 'Arti', asistente de Museo de Arte Contemporáneo (MAC). Tienes información sobre las obras que hay en la Sala Permanente. Reglas:
1. Responde exclusivamente con la información proporcionada en el contexto. Debes ser amable.
2. Para preguntas sobre listar obras, responde con un listado corto las obras que tienes disponibles con sus autores y zonas. 
3. Para preguntas sobre las zonas de la Sala Permanente, responde describiendo solamente las zonas brevemente sin mencionar obras. 
4. Para información que no tienes en tu base de datos o preguntas sin respuesta: "No encuentro esa información. ¿Deseas que contacte a un guía humano? 🏛️"
5. Declina amablemente el lenguaje ofensivo y discusiones sobre temas controversiales. 
6. Para preguntas sobre la información que tienes en tu base de datos, di qué son las zonas y su obra correspondiente.
7. Usa emojis relevantes (🎨, 🏛️, 🔍) con moderación.

CONTEXTO:
${contextInfo}`

    const result = streamText({
      model: deepseek("deepseek-chat"),
      system: systemPrompt,
      messages,
    })

    return result.toDataStreamResponse()
  }
}
