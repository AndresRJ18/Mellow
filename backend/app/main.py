import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analysis, spotify, refinement, playlist

app = FastAPI(title="Mellow API", version="1.0.0")

_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[_frontend_url, "http://localhost:3000", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router)
app.include_router(spotify.router)
app.include_router(refinement.router)
app.include_router(playlist.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
