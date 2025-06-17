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
    zona_filter: Optional[str] = None
    max_results: Optional[int] = 4

class ObraResponse(BaseModel):
    id: str
    metadata: Dict[str, Any]
    fragmento: str

SYSTEM_PROMPT = """
Eres 'Arti', asistente de Museo de Arte Contemporáneo (MAC). Tienes información sobre las obras que hay en la Sala Permanente. Reglas:
1. Responde exclusivamente con la información proporcionada en el contexto. Debes ser amable.
2. Para preguntas sobre listar obras, responde con un listado corto las obras que tienes disponibles con sus autores y zonas. 
3. Para preguntas sobre las zonas de la Sala Permanente, responde describiendo solamente las zonas brevemente sin mencionar obras. 
4. Para información que no tienes en tu base de datos o preguntas sin respuesta: "No encuentro esa información. ¿Deseas que contacte a un guía humano? 🏛️"
5. Declina amablemente el lenguaje ofensivo y discusiones sobre temas controversiales. 
6. Para preguntas sobre la información que tienes en tu base de datos, di qué son las zonas y su obra correspondiente.
7. Usa emojis relevantes (🎨, 🏛️, 🔍) con moderación.

Contexto:
{context}
"""

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error no controlado: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "Ocurrió un error interno. Por favor intenta nuevamente."}
    )

def build_deepseek_payload(context: str, user_message: str) -> Dict[str, Any]:
    """Construye el payload para la API de DeepSeek"""
    return {
        "model": "deepseek-v3",
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT.format(context=context)
            },
            {
                "role": "user",
                "content": user_message
            }
        ],
        "temperature": 0.3,
        "max_tokens": 1000,
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
        
        # Llamar a DeepSeek con el formato correcto
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT.format(context=context)
                },
                {
                    "role": "user",
                    "content": chat_request.message
                }
            ],
            "temperature": 0.7,
            "max_tokens": 200,
            "stream": False
        }
        
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
