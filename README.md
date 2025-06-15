# Chatbot del Museo MAC - Backend con IA

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg) 
![FastAPI](https://img.shields.io/badge/Framework-FastAPI-green.svg)
![ChromaDB](https://img.shields.io/badge/Vector_DB-ChromaDB-orange.svg)

## 🚀 Características principales
- Búsqueda semántica de obras artísticas
- Respuestas con DeepSeek-V3

## 🛠 Instalación rápida
```bash
git clone https://github.com/bianca-ap01/chatbot-mac.git
cd chatbot-mac
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python chroma_setup.py
```
## ⚙️ Variables de entorno

```bash
DEEPSEEK_API_KEY=tu_clave
```

~~~
Nota: Requiere cuenta en DeepSeek Platform
~~~