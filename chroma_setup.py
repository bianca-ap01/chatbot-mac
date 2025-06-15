import chromadb
from sentence_transformers import SentenceTransformer

# Datos del museo MAC (documentos e ids permanecen igual)
documents = [
    # Zonas del museo
    "Zona IAC: Alberga obras del Instituto de Arte Contemporáneo (1955-1972), pionero en difundir arte moderno europeo y estadounidense en Perú.",
    "Zona Radicalidad y resistencia: Exhibe obras que cuestionan valores estéticos tradicionales y visibilizan identidades marginadas.",
    "Zona Referente y Postmodernidad: Obras post-1980 que usan serigrafía y apropiación de imágenes de cultura popular (publicidad, periódicos, música chicha).",
    "Zona Centro: Espacio central con pintura, fotografía, instalación y videoarte que refleja fracturas sociales peruanas, como el debate sobre arte tradicional vs. académico.",
    
    # Obras individuales
    "Obra: El mundo en llamas | Artista: Fernando Bryce | Zona: Referente y Postmodernidad | Técnica: Instalación (95 dibujos en tinta) | Detalles: Crítica a la construcción histórica mediante reproducción de periódicos de la Segunda Guerra Mundial. Usa 'método de análisis mimético' para deconstruir discursos de poder.",
    "Obra: Shao Kené 5 | Artista: Sara Flores | Zona: Radicalidad y resistencia | Técnica: Pintura con pigmentos naturales (huito) | Detalles: Reinterpretación contemporánea de diseños geométricos Shipibo-Konibo ('kené'), simbolizando cosmovisión amazónica y resistencia cultural.",
    "Obra: Retablo Ayacuchano | Artista: Joaquín López Antay | Zona: Centro | Técnica: Escultura en madera con masa de papa | Detalles: Representa sincretismo cultural con escenas religiosas/costumbristas. Premio Nacional de Artes 1975 generó debate sobre arte popular.",
    "Obra: Vertical celeste | Artista: Jorge Eduardo Eielson | Zona: IAC | Técnica: Instalación (luz/arena) | Detalles: Inspirado en quipus y astrología andina. Conecta Alfa Centauro con herencia precolombina, explorando arte conceptual y espacial."
]

# Metadatos corregidos (sin listas)
metadatas = [
    # Zonas
    {"tipo": "zona", "nombre": "IAC", "periodo": "1955-1972"},
    {"tipo": "zona", "nombre": "Radicalidad y resistencia", "tematica": "critica social"},
    {"tipo": "zona", "nombre": "Referente y Postmodernidad", "tecnicas": "serigrafia, apropiacion"},
    {"tipo": "zona", "nombre": "Centro", "formatos": "pintura, fotografia, instalacion"},
    
    # Obras
    {"tipo": "obra", "artista": "Fernando Bryce", "zona": "Referente y Postmodernidad", "año": "2000s", "tecnica": "instalacion"},
    {"tipo": "obra", "artista": "Sara Flores", "zona": "Radicalidad y resistencia", "cultura": "Shipibo-Konibo", "material": "pigmentos naturales"},
    {"tipo": "obra", "artista": "Joaquin Lopez Antay", "zona": "Centro", "estilo": "arte popular", "premio": "1975"},
    {"tipo": "obra", "artista": "Jorge Eduardo Eielson", "zona": "IAC", "inspiracion": "quipus/astrologia", "medio": "instalacion luminica"}
]

ids = [
    "zona-iac", "zona-radicalidad", "zona-postmodernidad", "zona-centro",
    "obra-bryce", "obra-flores", "obra-lopez-antay", "obra-eielson"
]

def initialize_chroma():
    # 1. Inicializar ChromaDB
    chroma_client = chromadb.PersistentClient(path="./mac_db")
    collection = chroma_client.get_or_create_collection("mac_info")

    # 2. Generar embeddings
    embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    embeddings = embedding_model.encode(documents).tolist()

    # 3. Cargar datos
    collection.add(
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids
    )
    
    print("✅ Base de datos ChromaDB inicializada correctamente con las obras y zonas del MAC")

if __name__ == "__main__":
    initialize_chroma()