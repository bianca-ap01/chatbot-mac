"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MessageCircle, Send, X, ArrowRight, Clock, MapPin, Palette } from "lucide-react"
import Image from "next/image"
import React from "react"

export default function MuseumApp() {
  const [showChat, setShowChat] = useState(false)
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()

  const obrasReales = [
    {
      titulo: "El mundo en llamas",
      artista: "Fernando Bryce",
      año: "2000s",
      tecnica: "Instalación (95 dibujos en tinta)",
      descripcion:
        "Crítica a la construcción histórica mediante reproducción de periódicos de la Segunda Guerra Mundial",
      imagen: "/obras/el-mundo-en-llamas.png",
      id: "obra-bryce",
    },
    {
      titulo: "Shao Kené 5",
      artista: "Sara Flores",
      año: "Contemporáneo",
      tecnica: "Pintura con pigmentos naturales (huito)",
      descripcion: "Reinterpretación contemporánea de diseños geométricos Shipibo-Konibo",
      imagen: "/obras/shao-kene-5.png",
      id: "obra-flores",
    },
    {
      titulo: "Retablo Ayacuchano",
      artista: "Joaquín López Antay",
      año: "1975",
      tecnica: "Escultura en madera con masa de papa",
      descripcion: "Representa sincretismo cultural con escenas religiosas y costumbristas",
      imagen: "/obras/retablo-ayacuchano.png",
      id: "obra-lopez-antay",
    },
    {
      titulo: "Vertical celeste",
      artista: "Jorge Eduardo Eielson",
      año: "Contemporáneo",
      tecnica: "Instalación (luz/arena)",
      descripcion: "Inspirado en quipus y astrología andina, conecta Alfa Centauro con herencia precolombina",
      imagen: "/obras/vertical-celeste.jpeg",
      id: "obra-eielson",
    },
  ]

  const preguntasRapidas = [
    "¿Qué obras hay en el museo?",
    "Cuéntame sobre Fernando Bryce",
    "¿Qué es el arte Shipibo-Konibo?",
    "¿Cuánto tiempo necesito para la visita?",
    "¿Qué significa el Retablo Ayacuchano?",
  ]

  // Función completa para procesar texto con formato Markdown
  const processMarkdownText = (text: string) => {
    const lines = text.split("\n")

    return lines.map((line, index) => {
      const trimmedLine = line.trim()

      // Títulos con # (H1, H2, H3)
      if (trimmedLine.startsWith("# ")) {
        return (
          <h1 key={index} className="text-2xl font-bold text-black mb-4 mt-6">
            {trimmedLine.replace("# ", "")}
          </h1>
        )
      }
      if (trimmedLine.startsWith("## ")) {
        return (
          <h2 key={index} className="text-xl font-bold text-black mb-3 mt-5">
            {trimmedLine.replace("## ", "")}
          </h2>
        )
      }
      if (trimmedLine.startsWith("### ")) {
        return (
          <h3 key={index} className="text-lg font-bold text-black mb-2 mt-4">
            {trimmedLine.replace("### ", "")}
          </h3>
        )
      }

      // Citas con >
      if (trimmedLine.startsWith("> ")) {
        return (
          <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-3">
            {processInlineMarkdown(trimmedLine.replace("> ", ""))}
          </blockquote>
        )
      }

      // Código en bloque con \`\`\`
      if (trimmedLine.startsWith("```")) {
        return (
          <pre key={index} className="bg-gray-100 p-3 rounded-lg text-sm font-mono my-3 overflow-x-auto">
            <code>{trimmedLine.replace(/```\w*/, "").replace("```", "")}</code>
          </pre>
        )
      }

      // Líneas horizontales con ---
      if (trimmedLine === "---" || trimmedLine === "***") {
        return <hr key={index} className="border-gray-300 my-4" />
      }

      // Listas numeradas (1. 2. 3.)
      if (/^\d+\.\s/.test(trimmedLine)) {
        const content = trimmedLine.replace(/^\d+\.\s/, "")
        return (
          <div key={index} className="flex items-start gap-3 mb-2 ml-4">
            <span className="text-black font-medium mt-0.5 min-w-[20px]">{trimmedLine.match(/^\d+/)?.[0]}.</span>
            <div className="flex-1">{processInlineMarkdown(content)}</div>
          </div>
        )
      }

      // Listas con viñetas (- * +)
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ") || trimmedLine.startsWith("+ ")) {
        const content = trimmedLine.replace(/^[-*+]\s/, "")
        return (
          <div key={index} className="flex items-start gap-2 mb-2 ml-4">
            <span className="text-black mt-1 text-lg leading-none">•</span>
            <div className="flex-1">{processInlineMarkdown(content)}</div>
          </div>
        )
      }

      // Listas anidadas (  - o    -)
      if (trimmedLine.match(/^\s{2,}[-*+]\s/)) {
        const content = trimmedLine.replace(/^\s*[-*+]\s/, "")
        const indentLevel = Math.floor((trimmedLine.length - trimmedLine.trimStart().length) / 2)
        return (
          <div key={index} className={`flex items-start gap-2 mb-1 ml-${4 + indentLevel * 4}`}>
            <span className="text-gray-600 mt-1 text-sm leading-none">◦</span>
            <div className="flex-1">{processInlineMarkdown(content)}</div>
          </div>
        )
      }

      // Tablas simples (| col1 | col2 |)
      if (trimmedLine.includes("|") && trimmedLine.split("|").length > 2) {
        const cells = trimmedLine.split("|").filter((cell) => cell.trim())
        return (
          <div key={index} className="flex border-b border-gray-200 py-2">
            {cells.map((cell, cellIndex) => (
              <div key={cellIndex} className="flex-1 px-2 text-sm">
                {processInlineMarkdown(cell.trim())}
              </div>
            ))}
          </div>
        )
      }

      // Líneas vacías
      if (!trimmedLine) {
        return <div key={index} className="mb-3"></div>
      }

      // Párrafos normales
      return (
        <div key={index} className="mb-2 leading-relaxed">
          {processInlineMarkdown(line)}
        </div>
      )
    })
  }

  // Función para procesar markdown inline (negrita, cursiva, código, enlaces)
  const processInlineMarkdown = (text: string) => {
    const parts = []
    const currentIndex = 0

    // Regex para encontrar patrones de markdown inline
    const patterns = [
      {
        regex: /\*\*(.*?)\*\*/g,
        component: (match: string, content: string) => <strong className="font-bold text-black">{content}</strong>,
      },
      { regex: /\*(.*?)\*/g, component: (match: string, content: string) => <em className="italic">{content}</em> },
      {
        regex: /`(.*?)`/g,
        component: (match: string, content: string) => (
          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{content}</code>
        ),
      },
      {
        regex: /\[([^\]]+)\]$$([^)]+)$$/g,
        component: (match: string, text: string, url: string) => (
          <a href={url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        ),
      },
      {
        regex: /~~(.*?)~~/g,
        component: (match: string, content: string) => <del className="line-through text-gray-500">{content}</del>,
      },
      {
        regex: /==(.*?)==/g,
        component: (match: string, content: string) => <mark className="bg-yellow-200 px-1">{content}</mark>,
      },
    ]

    const workingText = text
    const replacements: Array<{ start: number; end: number; component: JSX.Element }> = []

    // Encontrar todos los patrones
    patterns.forEach((pattern, patternIndex) => {
      let match
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags)

      while ((match = regex.exec(workingText)) !== null) {
        const component = pattern.component(match[0], match[1], match[2])
        replacements.push({
          start: match.index,
          end: match.index + match[0].length,
          component: React.cloneElement(component, { key: `${patternIndex}-${match.index}` }),
        })
      }
    })

    // Ordenar reemplazos por posición
    replacements.sort((a, b) => a.start - b.start)

    // Construir el resultado
    let lastIndex = 0
    const result: (string | JSX.Element)[] = []

    replacements.forEach((replacement, index) => {
      // Agregar texto antes del reemplazo
      if (replacement.start > lastIndex) {
        result.push(workingText.slice(lastIndex, replacement.start))
      }

      // Agregar el componente
      result.push(replacement.component)
      lastIndex = replacement.end
    })

    // Agregar texto restante
    if (lastIndex < workingText.length) {
      result.push(workingText.slice(lastIndex))
    }

    return result.length > 0 ? result : text
  }

  // Función para detectar si un mensaje menciona alguna obra y mostrar su imagen
  const renderMessageWithImages = (content: string) => {
    const obrasMencionadas = obrasReales.filter(
      (obra) =>
        content.toLowerCase().includes(obra.titulo.toLowerCase()) ||
        content.toLowerCase().includes(obra.artista.toLowerCase()) ||
        content.toLowerCase().includes("bryce") ||
        content.toLowerCase().includes("flores") ||
        content.toLowerCase().includes("lópez antay") ||
        content.toLowerCase().includes("eielson") ||
        content.toLowerCase().includes("shipibo") ||
        content.toLowerCase().includes("retablo") ||
        content.toLowerCase().includes("vertical celeste") ||
        content.toLowerCase().includes("mundo en llamas"),
    )

    return (
      <div className="space-y-3">
        <div className="text-gray-800">{processMarkdownText(content)}</div>
        {obrasMencionadas.length > 0 && (
          <div className="space-y-3 mt-4">
            {obrasMencionadas.map((obra) => (
              <div key={obra.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="aspect-video relative">
                  <Image src={obra.imagen || "/placeholder.svg"} alt={obra.titulo} fill className="object-cover" />
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-sm text-black">{obra.titulo}</h4>
                  <p className="text-xs text-gray-600">
                    {obra.artista} • {obra.año}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (showChat) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-full mx-auto">
          {/* Header del chat - Optimizado para móvil */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <Button
              variant="ghost"
              onClick={() => setShowChat(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg p-2"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center relative">
                <span className="text-white font-bold text-lg">A</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-black">Arti</h1>
                <p className="text-xs text-gray-500">Guía Virtual MAC Lima</p>
              </div>
            </div>
            <div className="w-10"></div>
          </div>

          {/* Chat - Optimizado para móvil */}
          <div className="flex flex-col h-[calc(100vh-80px)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-4 relative">
                    <span className="text-white font-bold text-xl">A</span>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-3">¡Hola! Soy Arti</h3>
                  <p className="text-gray-600 mb-6 text-base px-4">
                    Tu guía virtual del MAC Lima. Conozco las obras de nuestra colección.
                  </p>

                  <div className="space-y-4">
                    <p className="text-base font-semibold text-black">Pregúntame sobre:</p>
                    <div className="grid grid-cols-1 gap-2 px-4">
                      {preguntasRapidas.map((pregunta, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => {
                            const event = new Event("submit") as any
                            handleSubmit(event, { data: { message: pregunta } })
                          }}
                          className="text-sm hover:bg-black hover:text-white border border-gray-300 hover:border-black transition-all rounded-lg py-3 px-4 text-left justify-start font-medium w-full"
                        >
                          {pregunta}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-lg ${
                      message.role === "user" ? "bg-black text-white" : "bg-gray-50 text-black border border-gray-200"
                    }`}
                  >
                    {message.role === "user" ? (
                      <div className="whitespace-pre-wrap">
                        {message.parts.map((part, i) => {
                          if (part.type === "text") {
                            return <div key={i}>{part.text}</div>
                          }
                          return null
                        })}
                      </div>
                    ) : (
                      message.parts.map((part, i) => {
                        if (part.type === "text") {
                          return <div key={i}>{renderMessageWithImages(part.text)}</div>
                        }
                        return null
                      })
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-black rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">Arti está pensando...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input del chat - Fijo en la parte inferior */}
            <div className="border-t border-gray-200 bg-white p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Pregúntale a Arti sobre el MAC..."
                  className="flex-1 border border-gray-300 focus:border-black transition-colors rounded-lg py-3 px-4"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-black hover:bg-gray-800 text-white transition-colors rounded-lg px-4 py-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header - Optimizado para móvil */}
        <div className="text-center mb-12 pt-8 md:pt-16">
          <div className="mb-6">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-lg flex items-center justify-center mx-auto mb-6 shadow-lg border border-gray-100">
              <Image
                src="/mac-logo.png"
                alt="MAC Lima Logo"
                width={80}
                height={64}
                className="object-contain md:w-[100px] md:h-[80px]"
              />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-black mb-4 md:mb-6 tracking-tight leading-tight">
            MUSEO DE ARTE
            <br />
            <span className="text-black">CONTEMPORÁNEO</span>
          </h1>
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="w-12 md:w-16 h-0.5 bg-black"></div>
            <span className="text-lg md:text-xl font-bold text-black tracking-wider">LIMA</span>
            <div className="w-12 md:w-16 h-0.5 bg-black"></div>
          </div>
          <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8 max-w-3xl mx-auto px-4">
            Conoce nuestra colección con Arti, tu guía virtual especializado
          </p>
        </div>

        {/* Obras del MAC - Grid optimizado para móvil */}
        <div className="mb-12 md:mb-16">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-3 md:mb-4">Obras de la colección</h2>
            <p className="text-gray-600 max-w-2xl mx-auto px-4">
              Arti conoce estas obras de nuestra colección permanente
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {obrasReales.map((obra, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300 border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="aspect-video relative">
                  <Image src={obra.imagen || "/placeholder.svg"} alt={obra.titulo} fill className="object-cover" />
                </div>
                <CardHeader className="pb-3">
                  <h3 className="text-lg md:text-xl font-bold text-black mb-2">{obra.titulo}</h3>
                  <p className="text-gray-700 font-semibold">{obra.artista}</p>
                  <p className="text-sm text-gray-500">{obra.año}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm mb-2">{obra.tecnica}</p>
                  <p className="text-gray-600 text-sm">{obra.descripcion}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Información del museo - Grid optimizado para móvil */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
          <div className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Palette className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-black mb-2">4</div>
            <div className="text-gray-600 text-sm md:text-base">Obras con información detallada</div>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-black mb-2">Mar - Dom</div>
            <div className="text-gray-600 text-sm md:text-base">10:00 - 18:00 hrs</div>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-3 md:mb-4">
              <MapPin className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-black mb-2">Barranco</div>
            <div className="text-gray-600 text-sm md:text-base">Lima, Perú</div>
          </div>
        </div>

        {/* CTA - Optimizado para móvil */}
        <div className="text-center">
          <div className="bg-gray-50 rounded-lg p-6 md:p-12 max-w-4xl mx-auto border border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6 md:mb-8">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl md:text-2xl">A</span>
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-black">Conoce a Arti</h2>
                <p className="text-gray-600">Tu guía virtual del MAC Lima</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6 md:mb-8 text-base md:text-lg max-w-2xl mx-auto px-4">
              Arti conoce las obras del MAC Lima y puede ayudarte a planificar tu visita con información detallada sobre
              técnicas, contexto histórico y conceptos artísticos.
            </p>

            <Button
              onClick={() => setShowChat(true)}
              size="lg"
              className="bg-black hover:bg-gray-800 text-white text-base md:text-lg px-6 md:px-8 py-3 md:py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group w-full md:w-auto"
            >
              <MessageCircle className="mr-3 h-5 w-5" />
              Conversar con Arti
              <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
