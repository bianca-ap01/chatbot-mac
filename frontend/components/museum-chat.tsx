"use client"

import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Palette, Send } from "lucide-react"

export default function MuseumChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()

  const preguntasCool = [
    "¿Qué obras están más buenas para TikTok? 📱",
    "¿Hay algo sobre cambio climático? 🌍",
    "¿Cuál es la obra más interactiva? ⚡",
    "¿Dónde puedo tomar las mejores fotos? 📸",
    "¿Qué obra habla de tecnología? 🤖",
  ]

  const handleSuggestionClick = (pregunta: string) => {
    const event = new Event("submit") as any
    handleSubmit(event, { data: { message: pregunta } })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Asistente Virtual del Museo
          <div className="ml-auto w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎨✨</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">¡Hey! Bienvenido al museo más cool</h3>
            <p className="text-gray-600 mb-4">Pregúntame sobre las obras, eventos, o lo que necesites saber</p>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Pregúntame algo cool:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {preguntasCool.map((pregunta, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(pregunta)}
                    className="text-xs hover:bg-purple-50"
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
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <div className="whitespace-pre-wrap">
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return <div key={i}>{part.text}</div>
                  }
                  return null
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">Pensando algo cool...</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Pregúntame lo que sea sobre el museo... 💬"
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
