from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware  # Importa CORSMiddleware
from pydantic import BaseModel
import chromadb
from sentence_transformers import SentenceTransformer
import requests
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict, Any
import logging

# Configuración básica de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

app = FastAPI(
    title="Chatbot del Museo MAC",
    description="Asistente de IA para el Museo de Arte Contemporáneo con Deepseek y ChromaDB",
    version="2.1",
    docs_url="/docs",
    redoc_url=None
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Aceptar solicitudes de todos los orígenes
    allow_credentials=True,
    allow_methods=["*"],  # Aceptar todos los métodos HTTP (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Aceptar todos los encabezados
)

# Configuración ChromaDB
try:
    chroma_client = chromadb.PersistentClient(path="./mac_db")
    collection = chroma_client.get_collection("mac_info")
    embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
except Exception as e:
    logger.error(f"Error inicializando ChromaDB: {str(e)}")
    raise

# Configuración Deepseek
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not DEEPSEEK_API_KEY:
    logger.error("DEEPSEEK_API_KEY no encontrada en variables de entorno")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

class ChatRequest(BaseModel):
    message: str
    message_history: Optional[List[Dict[str, str]]] = None  # Nuevo campo para historial
    zona_filter: Optional[str] = None
    max_results: Optional[int] = 4

class ObraResponse(BaseModel):
    id: str
    metadata: Dict[str, Any]
    fragmento: str

SYSTEM_PROMPT = """
Eres 'Arti', el asistente conversacional del Museo de Arte Contemporáneo (MAC). Tu conocimiento se limita EXCLUSIVAMENTE a la información proporcionada en el contexto. Sigue estas pautas:

1. 🔍 **Precisión absoluta**:
   - Usa SOLO datos del contexto, citando directamente cuando sea posible.
   - Ejemplo: "La obra 'nombre' de artista se encuentra en zona"

2. 💬 **Estilo natural pero controlado**:
   - Saludos: "¡Hola! ¿En qué puedo ayudarte con la colección del MAC hoy?"
   - Respuestas: "Por lo que veo en nuestros registros..." 
   - Cierre: "¿Hay algo más sobre la colección que te interese? 🎨"

3. 🖼️ **Manejo de obras**:
   - Para listados: "Actualmente tengo información sobre: 1) 'Obra A' de X (Zona 1), 2) 'Obra B' de Y (Zona 2)"
   - Para detalles: "Nuestra ficha indica: [datos exactos del contexto]"

4. 🗺️ **Sobre zonas**:
   - "La zona se caracteriza por: [descripción literal del contexto]"
   - "Las obras documentadas en esta zona son: [lista exacta]"

5. ❓ **Lo desconocido**:
   - "No encuentro esa información exacta en nuestros archivos. ¿Quieres que revise algo similar?"
   - "Mis datos no incluyen eso. ¿Te interesaría saber sobre [tema relacionado disponible]?"

6. 🛡️ **Seguridad**:
   - Si la pregunta requiere interpretación: "Solo puedo compartir los datos documentados"
   - Para temas fuera del MAC: "Mi expertise es solo sobre la colección permanente del museo"

7. ✨ **Personalidad**:
   - Puedes mostrar entusiasmo breve: "¡Es una de nuestras piezas más interesantes!"
   - Usa 1-2 emojis máximo por respuesta (🎨, 🏛️, 🔍)
   - Invita a continuar: "¿Quieres profundizar en algún aspecto?"

Contexto disponible:
{context}
"""

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error no controlado: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "Ocurrió un error interno. Por favor intenta nuevamente."}
    )

def build_deepseek_payload(context: str, user_message: str, message_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
    """Construye el payload para la API de DeepSeek con historial de contexto"""
    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT.format(context=context)
        }
    ]
    
    # Agregar historial de mensajes si existe (filtrando para asegurar formato correcto)
    if message_history:
        for msg in message_history:
            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
    
    # Agregar el último mensaje del usuario
    messages.append({
        "role": "user",
        "content": user_message
    })
    
    return {
        "model": "deepseek-chat",  # Cambiado a deepseek-chat
        "messages": messages,
        "temperature": 0.1,  # Ajustado para más precisión
        "max_tokens": 512,  # Reducido a un valor seguro
        "stream": False
    }
    
@app.post("/chat", response_model=Dict[str, Any])
async def chat_endpoint(chat_request: ChatRequest):
    try:
        # Validar API Key
        if not DEEPSEEK_API_KEY:
            raise HTTPException(status_code=401, detail="API Key no configurada")

        # Búsqueda en ChromaDB
        query_embedding = embedding_model.encode([chat_request.message]).tolist()
        
        where_filter = {"tipo": "obra"}
        if chat_request.zona_filter:
            where_filter["zona"] = chat_request.zona_filter
        
        results = collection.query(
            query_embeddings=query_embedding,
            where=where_filter,
            n_results=chat_request.max_results or 3
        )
        
        if not results["documents"]:
            return {
                "response": "No encuentro información relevante. ¿Quieres buscar algo más específico? 🔍",
                "suggestions": ["Listar todas las obras", "Ver zonas del museo"]
            }
        
        # Preparar contexto
        context = "\n".join(f"- {doc}" for doc in results["documents"][0])
        
        # Llamar a DeepSeek con el historial de mensajes
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        payload = build_deepseek_payload(
            context=context,
            user_message=chat_request.message,
            message_history=chat_request.message_history
        )
        
        response = requests.post(
            DEEPSEEK_API_URL,
            headers=headers,
            json=payload,
            timeout=15
        )
        
        # Manejar errores específicos de la API
        if response.status_code != 200:
            error_detail = response.json().get("error", {}).get("message", "Error desconocido de la API")
            logger.error(f"DeepSeek API error: {error_detail}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error en el servicio de IA: {error_detail}"
            )
        
        api_response = response.json()
        return {
            "response": api_response["choices"][0]["message"]["content"],
            "relevant_works": [
                {"id": id_, "metadata": meta} 
                for id_, meta in zip(results["ids"][0], results["metadatas"][0])
            ]
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error de conexión: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail="Error temporal del servicio. Por favor intenta nuevamente."
        )
    except Exception as e:
        logger.error(f"Error inesperado: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Ocurrió un error interno. Por favor intenta nuevamente."
        )

@app.get("/obras", response_model=Dict[str, Any])
async def list_obras(zona: Optional[str] = None) -> Dict[str, Any]:
    try:
        where_filter = {"tipo": "obra"}
        if zona:
            where_filter["zona"] = zona
            
        obras = collection.get(
            where=where_filter,
            include=["metadatas", "documents"]
        )
        
        return {
            "count": len(obras["ids"]),
            "results": [
                {
                    "id": id_,
                    "metadata": meta,
                    "fragmento": doc.split("|")[0].strip()
                }
                for id_, meta, doc in zip(
                    obras["ids"], 
                    obras["metadatas"], 
                    obras["documents"]
                )
            ]
        }
    except Exception as e:
        logger.error(f"Error al listar obras: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error al recuperar la lista de obras."
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=True
    )
