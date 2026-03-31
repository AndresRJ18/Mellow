"""Deezer API — used only as preview fallback when Spotify preview_url is None.

No API key required. Deezer provides 30-second MP3 previews for most tracks globally,
including Latin American and older catalogues that Spotify often leaves without previews.
"""
from typing import Optional
import httpx

_BASE = "https://api.deezer.com"
_client: Optional[httpx.AsyncClient] = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=5.0)
    return _client


async def search_preview(artist: str, title: str) -> str | None:
    """Search Deezer for a track and return its 30s preview URL, or None if not found."""
    query = f'artist:"{artist}" track:"{title}"'
    try:
        resp = await _get_client().get(
            f"{_BASE}/search",
            params={"q": query, "limit": 3},
        )
        resp.raise_for_status()
        data = resp.json().get("data", [])
        if data:
            return data[0].get("preview") or None
    except Exception:
        pass
    return None
