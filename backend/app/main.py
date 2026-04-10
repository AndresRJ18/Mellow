import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analysis, spotify, refinement, playlist

app = FastAPI(title="Mellow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mellow.lat", "https://www.mellow.lat"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(analysis.router)
app.include_router(spotify.router)
app.include_router(refinement.router)
app.include_router(playlist.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
