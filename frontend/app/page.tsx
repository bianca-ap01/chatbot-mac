"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MessageCircle, Send, X, ArrowRight, Clock, MapPin, Palette } from "lucide-react"
import Image from "next/image"
import type React from "react"

export default function MuseumApp() {
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<
      Array<{
        id: string
        role: "user" | "assistant"
        content: string
        createdAt: Date
        relevantWorks?: any[]
      }>
  >([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

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

  // Componente de animación de typing
  const TypingAnimation = () => (
      <div className="flex justify-start">
        <div className="max-w-[85%] p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
            <span className="text-sm text-gray-600">Arti está escribiendo...</span>
          </div>
        </div>
      </div>
  )

  // Función de fallback para usar la API route local
  const handleSubmitWithFallback = async (message: string) => {
    try {
      console.log("Trying fallback API route...")

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: message }],
        }),
      })

      if (response.ok) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ""

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            fullResponse += chunk
          }
        }

        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant" as const,
          content: fullResponse || "Respuesta recibida del fallback",
          createdAt: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        throw new Error(`Fallback API failed: ${response.status}`)
      }
    } catch (error) {
      console.error("Fallback also failed:", error)

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content:
            "Lo siento, tanto el servidor principal como el de respaldo están experimentando problemas. Intenta de nuevo más tarde.",
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  // Function to send a message to the backend and retrieve response
  const handleSubmitWithBackendResponse = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isLoading || !input.trim()) return

    const message = input
    setIsLoading(true)

    // Agregar mensaje del usuario
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: message,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    try {
      console.log("Sending request to backend with message:", message)

      const backendResponse = await fetch("https://afc5-38-187-27-14.ngrok-free.app/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          Accept: "application/json",
        },
        mode: "cors",
        body: JSON.stringify({ message: message }),
      })

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        console.log("Backend Response:", data)

        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant" as const,
          content: data.response || "Respuesta recibida sin contenido",
          createdAt: new Date(),
          relevantWorks: data.relevant_works || [],
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        throw new Error(`Backend responded with status: ${backendResponse.status}`)
      }
    } catch (error) {
      console.error("Primary endpoint failed, trying fallback:", error)

      // Intentar con el fallback
      await handleSubmitWithFallback(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to process Markdown text
  const processMarkdownText = (text: string) => {
    const lines = text.split("\n")

    return lines.map((line, index) => {
      const trimmedLine = line.trim()

      // Titles with # (H1, H2, H3)
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

      // Blockquotes with >
      if (trimmedLine.startsWith("> ")) {
        return (
            <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-3">
              {processInlineMarkdown(trimmedLine.replace("> ", ""))}
            </blockquote>
        )
      }

      // Code blocks with \`\`\`
      if (trimmedLine.startsWith("```")) {
        return (
            <pre key={index} className="bg-gray-100 p-3 rounded-lg text-sm font-mono my-3 overflow-x-auto">
            <code>{trimmedLine.replace(/```\w*/, "").replace("```", "")}</code>
          </pre>
        )
      }

      // Horizontal lines with ---
      if (trimmedLine === "---" || trimmedLine === "***") {
        return <hr key={index} className="border-gray-300 my-4" />
      }

      // Ordered lists (1. 2. 3.)
      if (/^\d+\.\s/.test(trimmedLine)) {
        const content = trimmedLine.replace(/^\d+\.\s/, "")
        return (
            <div key={index} className="flex items-start gap-3 mb-2 ml-4">
              <span className="text-black font-medium mt-0.5 min-w-[20px]">{trimmedLine.match(/^\d+/)?.[0]}.</span>
              <div className="flex-1">{processInlineMarkdown(content)}</div>
            </div>
        )
      }

      // Bulleted lists (- * +)
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ") || trimmedLine.startsWith("+ ")) {
        const content = trimmedLine.replace(/^[-*+]\s/, "")
        return (
            <div key={index} className="flex items-start gap-2 mb-2 ml-4">
              <span className="text-black mt-1 text-lg leading-none">•</span>
              <div className="flex-1">{processInlineMarkdown(content)}</div>
            </div>
        )
      }

      // Nested lists (  - or    -)
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

      // Tables (| col1 | col2 |)
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

      // Empty lines
      if (!trimmedLine) {
        return <div key={index} className="mb-3"></div>
      }

      // Regular paragraphs
      return (
          <div key={index} className="mb-2 leading-relaxed">
            {processInlineMarkdown(line)}
          </div>
      )
    })
  }

  // Function to process inline markdown (bold, italic, code, links)
  const processInlineMarkdown = (text: string) => {
    // Si el texto está vacío, retornarlo tal como está
    if (!text || typeof text !== "string") {
      return text
    }

    const result: (string | JSX.Element)[] = []
    const currentText = text
    let keyCounter = 0

    // Procesar cada patrón uno por uno para evitar conflictos
    const patterns = [
      {
        name: "bold",
        regex: /\*\*(.*?)\*\*/g,
        component: (content: string, key: string) => (
            <strong key={key} className="font-bold text-black">
              {content}
            </strong>
        ),
      },
      {
        name: "italic",
        regex: /\*((?!\*)(.*?))\*/g, // Evitar que capture ** como *
        component: (content: string, key: string) => (
            <em key={key} className="italic">
              {content}
            </em>
        ),
      },
      {
        name: "code",
        regex: /`(.*?)`/g,
        component: (content: string, key: string) => (
            <code key={key} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
              {content}
            </code>
        ),
      },
      {
        name: "strikethrough",
        regex: /~~(.*?)~~/g,
        component: (content: string, key: string) => (
            <del key={key} className="line-through text-gray-500">
              {content}
            </del>
        ),
      },
      {
        name: "highlight",
        regex: /==(.*?)==/g,
        component: (content: string, key: string) => (
            <mark key={key} className="bg-yellow-200 px-1">
              {content}
            </mark>
        ),
      },
      {
        name: "link",
        regex: /\[([^\]]+)\]$$([^)]+)$$/g,
        component: (text: string, url: string, key: string) => (
            <a key={key} href={url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              {text}
            </a>
        ),
      },
    ]

    // Función para procesar un patrón específico
    const processPattern = (text: string, pattern: any) => {
      const parts: (string | JSX.Element)[] = []
      let lastIndex = 0
      let match

      // Reset regex
      pattern.regex.lastIndex = 0

      while ((match = pattern.regex.exec(text)) !== null) {
        // Agregar texto antes del match
        if (match.index > lastIndex) {
          parts.push(text.slice(lastIndex, match.index))
        }

        // Crear el componente
        if (pattern.name === "link") {
          parts.push(pattern.component(match[1], match[2], `${pattern.name}-${keyCounter++}`))
        } else {
          parts.push(pattern.component(match[1], `${pattern.name}-${keyCounter++}`))
        }

        lastIndex = match.index + match[0].length
      }

      // Agregar texto restante
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex))
      }

      return parts.length > 0 ? parts : [text]
    }

    // Procesar todos los patrones
    let currentResult: (string | JSX.Element)[] = [currentText]

    patterns.forEach((pattern) => {
      const newResult: (string | JSX.Element)[] = []

      currentResult.forEach((part) => {
        if (typeof part === "string") {
          const processed = processPattern(part, pattern)
          newResult.push(...processed)
        } else {
          newResult.push(part)
        }
      })

      currentResult = newResult
    })

    return currentResult.length === 1 && typeof currentResult[0] === "string" ? currentResult[0] : currentResult
  }

  // Function to render message content with markdown
  const renderMessageContent = (content: string) => {
    return <div className="text-gray-800">{processMarkdownText(content)}</div>
  }

  if (showChat) {
    return (
        <div className="min-h-screen bg-white">
          <div className="max-w-full mx-auto">
            {/* Chat Header */}
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
                  <div
                      className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                      }`}
                  ></div>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-black">Arti</h1>
                  <p className="text-xs text-gray-500">{isLoading ? "Escribiendo..." : "Guía Virtual MAC Lima"}</p>
                </div>
              </div>
              <div className="w-10"></div>
            </div>

            {/* Chat */}
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
                                    setInput(pregunta)
                                    const event = new Event("submit") as any
                                    handleSubmitWithBackendResponse(event)
                                  }}
                                  className="text-sm hover:bg-black hover:text-white border border-gray-300 hover:border-black transition-all rounded-lg py-3 px-4 text-left justify-start font-medium w-full"
                                  disabled={isLoading}
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
                            <div className="whitespace-pre-wrap">{message.content}</div>
                        ) : (
                            <div>
                              <div className="text-gray-800">{renderMessageContent(message.content)}</div>
                              {/*{message.relevantWorks && message.relevantWorks.length > 0 && (*/}
                              {/*    <div className="space-y-3 mt-4">*/}
                              {/*      <p className="text-sm font-medium text-gray-600">Obras relacionadas:</p>*/}
                              {/*      {message.relevantWorks.map((work) => {*/}
                              {/*        const obra = obrasReales.find((o) => o.id === work.id)*/}
                              {/*        if (!obra) return null*/}

                              {/*        return (*/}
                              {/*            <div*/}
                              {/*                key={work.id}*/}
                              {/*                className="bg-white rounded-lg border border-gray-200 overflow-hidden"*/}
                              {/*            >*/}
                              {/*              <div className="aspect-video relative">*/}
                              {/*                <Image*/}
                              {/*                    src={obra.imagen || "/placeholder.svg"}*/}
                              {/*                    alt={obra.titulo}*/}
                              {/*                    fill*/}
                              {/*                    className="object-cover"*/}
                              {/*                />*/}
                              {/*              </div>*/}
                              {/*              <div className="p-3">*/}
                              {/*                <h4 className="font-semibold text-sm text-black">{obra.titulo}</h4>*/}
                              {/*                <p className="text-xs text-gray-600">*/}
                              {/*                  {obra.artista} • {obra.año}*/}
                              {/*                </p>*/}
                              {/*                <p className="text-xs text-gray-500 mt-1">{obra.tecnica}</p>*/}
                              {/*              </div>*/}
                              {/*            </div>*/}
                              {/*        )*/}
                              {/*      })}*/}
                              {/*    </div>*/}
                              {/*)}*/}
                            </div>
                        )}
                      </div>
                    </div>
                ))}

                {/* Animación de typing cuando está cargando */}
                {isLoading && <TypingAnimation />}
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 bg-white p-4">
                <form onSubmit={handleSubmitWithBackendResponse} className="flex gap-2">
                  <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder={isLoading ? "Arti está escribiendo..." : "Pregúntale a Arti sobre el MAC..."}
                      className="flex-1 border border-gray-300 focus:border-black transition-colors rounded-lg py-3 px-4"
                      disabled={isLoading}
                  />
                  <Button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="bg-black hover:bg-gray-800 text-white transition-colors rounded-lg px-4 py-3 disabled:opacity-50"
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
