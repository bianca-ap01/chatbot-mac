# Chatbot del Museo MAC (Arti)

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg) 
![FastAPI](https://img.shields.io/badge/Framework-FastAPI-green.svg)
![Next.js](https://img.shields.io/badge/Frontend-Next.js-black.svg)
![ChromaDB](https://img.shields.io/badge/Vector_DB-ChromaDB-orange.svg)


## 🚀 Características principales
- Búsqueda semántica de obras artísticas
- Respuestas con DeepSeek-V3
- Interfaz moderna con Next.js 14
- Diseño responsive con TailwindCSS

## 🛠 Instalación completa

Clonar el repositorio

```bash
git clone https://github.com/bianca-ap01/chatbot-mac.git
cd chatbot-mac
```
### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python chroma_setup.py
uvicorn app:app --reload
```
#### ⚙️ Variables de entorno

Crear archivo .env e ingresar la siguiente variable:

```bash
DEEPSEEK_API_KEY=tu_clave
```

Nota: Requiere cuenta en DeepSeek Platform

### Frontend
```bash
cd frontend 
npm install
npm run dev
```

