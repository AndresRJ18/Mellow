# mellow

![Status](https://img.shields.io/badge/status-active-brightgreen?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![AWS](https://img.shields.io/badge/AWS_Bedrock-Nova_Lite-FF9900?style=flat-square&logo=amazonaws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

> *El espacio entre despierto y soñando. Donde vive la música correcta.*

Mellow es una app de descubrimiento musical que encuentra canciones basadas en quién eres **ahora mismo** — no en tu historial. Describes tu estado emocional en lenguaje natural, y el sistema analiza ese contexto con IA para encontrar tracks que realmente resonarán contigo.

---

## Tabla de contenidos

- [Demo](#demo)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Flujo de usuario](#flujo-de-usuario)
- [API Reference](#api-reference)
- [Instalación y desarrollo local](#instalación-y-desarrollo-local)
- [Variables de entorno](#variables-de-entorno)
- [Despliegue](#despliegue)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Decisiones de diseño](#decisiones-de-diseño)

---

## Demo

> Proyecto presentado en el **CubePath Hackathon 2026**.

**Flujo completo:**
1. Describís tu estado emocional: *"Estoy en ese punto raro entre nostálgico y en paz, quiero algo que suene como recordar sin dolor"*
2. Bedrock Nova Lite analiza el contexto y genera parámetros de búsqueda
3. Mellow encuentra 10 canciones candidatas via Spotify
4. Escuchás previews de 30s, das like, explorás artistas
5. Refinás hasta 3 rondas si querés ajustar más el resultado
6. Compartís tu tarjeta de mood estilo Spotify Wrapped

---

## Características

- **Análisis emocional con IA** — AWS Bedrock Nova Lite convierte texto libre en parámetros musicales estructurados
- **Búsqueda contextual** — Consultas Spotify sanitizadas y serializadas, con fallback a Deezer para previews
- **Refinamiento iterativo** — Hasta 3 rondas, ajustando targets de audio basado en likes/dislikes
- **Panel de artistas** — Top 5 tracks, artistas relacionados, navegación encadenada
- **Mood Share Card** — Tarjeta visual estilo Spotify Wrapped generada como PNG descargable / compartible vía Web Share API
- **Previews de 30s** — Un track a la vez, con animación de waveform sincronizada
- **Sin login obligatorio** — La app funciona sin autenticación. Supabase disponible para persistencia opcional

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                     Usuario                          │
│              (texto libre: estado emocional)         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                    │
│   Landing → Onboarding → Loading → Results          │
│   Nginx · Framer Motion · Tailwind CSS              │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (REST)
                       ▼
┌─────────────────────────────────────────────────────┐
│                 Backend (FastAPI)                    │
│                                                      │
│  POST /analyze ──► Bedrock Nova Lite                │
│                      │                              │
│                      ▼                              │
│              Spotify Search API                     │
│              (serializado, sanitizado)              │
│                      │                              │
│                      ▼                              │
│           Deezer (preview fallback)                 │
│                      │                              │
│                      ▼                              │
│              Scoring + Ranking                      │
│                                                     │
│  POST /refine ──► Ajuste de targets                 │
│  GET  /artists/{id} ──► Spotify Artist API         │
└─────────────────────────────────────────────────────┘
```

**Principios clave:**
- **Stateless server** — todo el estado de sesión vive en el browser
- **Serialización de requests** — `asyncio.Semaphore(1)` + delay 0.3s para respetar rate limits de Spotify
- **Sanitización de queries** — strip automático de field filters deprecados (`artist:`, `genre:`, `year:`)
- **Double-check locking** — `asyncio.Lock` en token acquisition para evitar race conditions

---

## Stack tecnológico

| Capa | Tecnología | Motivo |
|------|-----------|--------|
| Frontend | React 18 + Vite | SPA rápida, ecosistema maduro |
| Animaciones | Framer Motion | Transiciones fluidas sin esfuerzo |
| Estilos | Tailwind CSS | Utility-first, consistente con el design system |
| Backend | FastAPI (Python 3.11) | Async nativo, tipado con Pydantic, DX excelente |
| IA | AWS Bedrock — Nova Lite | Bajo costo, latencia aceptable, buen razonamiento contextual |
| Música | Spotify Web API | Catálogo más completo disponible |
| Preview fallback | Deezer API | Spotify preview_url es null en muchos tracks para dev apps |
| Auth (opcional) | Supabase | Persistencia de sesiones y tracks guardados |
| Infra | Docker Compose | Un comando para levantar todo |

---

## Flujo de usuario

```
Landing
  │
  └─► Onboarding (3 pantallas)
        │  ① Estado emocional — texto libre (requerido, mín. 5 palabras)
        │  ② Universo musical  — texto libre o "Surprise me" (opcional)
        │  ③ Sliders           — tempo · lyrics/instrumental · familiaridad (opcional)
        │
        └─► Loading
              │  Partículas flotantes con colores de la paleta Bedrock
              │  Texto typewriter mientras corre el pipeline
              │
              └─► Results
                    │
                    ├── 10 track cards
                    │     ├─ Preview 30s + waveform animado
                    │     ├─ Like / Explore artist
                    │     └─ Link directo a Spotify
                    │
                    ├── Artist Panel (slide desde la derecha)
                    │     ├─ Foto + géneros + followers
                    │     ├─ Top 5 tracks con preview
                    │     └─ Artistas relacionados (navegación encadenada)
                    │
                    ├── Liked Panel / Library Tab
                    │     ├─ Tracks guardados con link a Spotify
                    │     └─ "Compartir mood" → Mood Share Card (PNG)
                    │
                    └── Refinamiento (hasta 3 rondas)
                          └─ Nuevos 10 tracks ajustados
```

---

## API Reference

### `POST /analyze`

Corre el pipeline completo: Bedrock → Spotify → scoring.

**Request body:**
```json
{
  "emotional_text": "estoy en ese punto raro entre nostálgico y en paz",
  "music_taste_text": "algo indie, quizás con piano",
  "slider_tempo": 3,
  "slider_lyrics": 2,
  "slider_familiarity": 3
}
```

**Response:**
```json
{
  "mood_label": "Sereno",
  "lectura": "Hay una calma particular en este momento...",
  "paleta": ["#8bc4e0", "#1a2a3a", "#2d4a5e"],
  "tracks": [...],
  "lift_tracks": [...],
  "lift_label": "Cuando estés listo",
  "current_targets": { "target_valence": 0.6, ... }
}
```

---

### `POST /refine`

Ajusta los targets de audio basado en feedback y busca nuevos tracks.

**Request body:**
```json
{
  "current_targets": { ... },
  "liked_ids": ["track1", "track2"],
  "disliked_ids": ["track3"],
  "all_shown_ids": ["track1", "track2", "track3", "..."],
  "rounds": [...],
  "emotional_text": "...",
  "music_taste_text": "..."
}
```

---

### `GET /artists/{artist_id}`

Detalle del artista: imagen, géneros, followers, popularity.

### `GET /artists/{artist_id}/top-tracks`

Top 5 tracks del artista para el market resuelto. Con fallback a búsqueda si el endpoint está restringido.

### `GET /artists/{artist_id}/related-artists`

Hasta 5 artistas relacionados. Retorna lista vacía si el endpoint está restringido (dev apps).

### `GET /health`

```json
{ "status": "ok" }
```

---

## Instalación y desarrollo local

### Prerrequisitos

- Docker + Docker Compose
- Cuenta AWS con acceso a Bedrock (modelo `us.amazon.nova-lite-v1:0`, región `us-east-1`)
- App de Spotify en [developer.spotify.com](https://developer.spotify.com) (modo desarrollo)
- (Opcional) Proyecto en [supabase.com](https://supabase.com)

### Setup

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd mellow

# 2. Configurar variables de entorno
cp .env.example .env
cp frontend/.env.example frontend/.env
# Editar ambos archivos con tus credenciales

# 3. Levantar con Docker Compose
docker compose up --build

# App disponible en:
#   Frontend → http://localhost:80
#   Backend  → http://localhost:8000
#   API docs → http://localhost:8000/docs
```

### Desarrollo sin Docker

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev                     # → http://localhost:5173
```

---

## Variables de entorno

### `/.env` (backend)

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

FRONTEND_URL=http://localhost:3000
```

### `/frontend/.env`

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
VITE_SPOTIFY_CLIENT_ID=        # mismo valor que SPOTIFY_CLIENT_ID del backend

VITE_SUPABASE_URL=             # opcional
VITE_SUPABASE_ANON_KEY=        # opcional
```

> **Nota Spotify:** Las dev apps tienen un límite de ~900 llamadas de búsqueda antes de ser restringidas permanentemente. Si las búsquedas empiezan a devolver 0 resultados, crear una nueva app en el dashboard de Spotify y actualizar ambos `.env`.

---

## Despliegue

El stack está pensado para un **único VPS** con Docker Compose.

```bash
# En el servidor
git pull
docker compose down
docker compose up --build -d
```

El frontend sirve el build estático de React via Nginx. El backend corre con Uvicorn detrás del mismo Compose network.

**No hay base de datos.** El estado de sesión vive en el browser (React state + SessionContext). Supabase se usa opcionalmente para persistencia entre visitas.

---

## Estructura del proyecto

```
mellow/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, routers
│   │   ├── routers/
│   │   │   ├── analysis.py          # POST /analyze — pipeline principal
│   │   │   ├── spotify.py           # GET /artists/* — panel de artistas
│   │   │   ├── refinement.py        # POST /refine — ajuste iterativo
│   │   │   └── playlist.py          # legacy (no usado por el frontend)
│   │   ├── services/
│   │   │   ├── bedrock.py           # Cliente AWS Bedrock + prompt execution
│   │   │   ├── spotify.py           # Spotify API client (token, search, artists)
│   │   │   ├── deezer.py            # Fallback de preview_url
│   │   │   ├── scoring.py           # Ranking por posición + popularidad
│   │   │   └── refinement.py        # Ajuste de audio targets desde feedback
│   │   ├── models/
│   │   │   └── schemas.py           # Todos los modelos Pydantic
│   │   └── prompts/
│   │       └── mood_analysis.py     # SYSTEM_PROMPT + USER_PROMPT_TEMPLATE
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Onboarding.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── Results.jsx          # Pantalla principal con tabs y panels
│   │   ├── components/
│   │   │   ├── TrackCard.jsx        # Card con preview, like, explore
│   │   │   ├── ArtistPanel.jsx      # Slide-in panel de artista
│   │   │   ├── LikedPanel.jsx       # Bottom sheet de tracks guardados
│   │   │   ├── MoodShareCard.jsx    # Tarjeta visual 360×640 (html-to-image)
│   │   │   ├── MoodShareModal.jsx   # Modal de preview + compartir / descargar
│   │   │   ├── WaveformBars.jsx     # Animación de audio
│   │   │   ├── Toast.jsx
│   │   │   └── tabs/
│   │   │       ├── LibraryTab.jsx
│   │   │       ├── ArtistsTab.jsx
│   │   │       └── MoodsTab.jsx
│   │   ├── context/
│   │   │   ├── SessionContext.jsx   # Estado global de sesión (stateless server)
│   │   │   └── AuthContext.jsx      # Supabase auth
│   │   ├── utils/
│   │   │   └── audioManager.js      # Singleton global — un track a la vez
│   │   ├── services/
│   │   │   └── supabaseData.js      # Persistencia opcional (mood sessions, likes)
│   │   └── api/
│   │       └── client.js            # Fetch wrapper hacia el backend
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Decisiones de diseño

**¿Por qué sin base de datos?**
La sesión vive en el browser. Para un hackathon, eliminar Postgres/Redis reduce la superficie de error y el tiempo de setup. Supabase cubre la persistencia opcional sin ops.

**¿Por qué no OAuth de Spotify?**
Los dev apps muestran advertencia de "redirect_uri insegura" en localhost con HTTP. La alternativa implementada — links individuales por track + Mood Share Card — da mejor UX sin las fricciones del OAuth.

**¿Por qué serializar las búsquedas de Spotify?**
`Semaphore(1)` + 0.3s de delay entre requests. Las dev apps de Spotify tienen rate limits agresivos y una cuota total de ~900 búsquedas. La serialización evita 429s y extiende la vida útil de cada app.

**¿Por qué Deezer como fallback?**
Spotify deprecated el campo `preview_url` para dev apps en muchos tracks. Deezer tiene una API pública sin auth que permite buscar previews de 30s por nombre de artista + canción.

**¿Por qué Nova Lite en vez de Claude/GPT-4?**
Costo y latencia. Nova Lite a ~$0.00006/1K tokens input es significativamente más barato para un hackathon que corre decenas de análisis. El razonamiento contextual necesario para parsear estados emocionales está dentro de sus capacidades.

---

*Mellow — CubePath Hackathon 2026*
