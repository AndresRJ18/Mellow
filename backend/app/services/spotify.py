import asyncio
import base64
import logging
import os
import time
from typing import Optional
import httpx

logger = logging.getLogger(__name__)

_BASE = "https://api.spotify.com/v1"
_AUTH_URL = "https://accounts.spotify.com/api/token"

# Persistent client — reuses TCP connections across all requests
_client: Optional[httpx.AsyncClient] = None

# Module-level token cache
_token: Optional[str] = None
_token_expires_at: float = 0.0
_token_lock = asyncio.Lock()

# Serialize search requests — Spotify rate-limits aggressively on concurrent calls
_search_semaphore = asyncio.Semaphore(1)


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=10.0)
    return _client


async def _get_token() -> str:
    global _token, _token_expires_at
    if _token and time.time() < _token_expires_at - 30:
        return _token

    async with _token_lock:
        # Re-check inside lock — another coroutine may have fetched it already
        if _token and time.time() < _token_expires_at - 30:
            return _token

        client_id = os.getenv("SPOTIFY_CLIENT_ID", "")
        client_secret = os.getenv("SPOTIFY_CLIENT_SECRET", "")
        credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

        resp = await _get_client().post(
            _AUTH_URL,
            headers={"Authorization": f"Basic {credentials}"},
            data={"grant_type": "client_credentials"},
        )
        resp.raise_for_status()
        data = resp.json()

        _token = data["access_token"]
        _token_expires_at = time.time() + data["expires_in"]
        return _token


async def _auth_headers() -> dict:
    token = await _get_token()
    return {"Authorization": f"Bearer {token}"}


def _sanitize_query(query: str) -> str:
    """Strip field filter prefixes and quotes (deprecated for dev apps Nov 2024).
    artist:'Michael Jackson' year:1982 → Michael Jackson 1982
    genre:reggaeton urbano        → reggaeton urbano
    """
    import re
    # Remove field prefixes like artist:, genre:, year:, etc.
    q = re.sub(r'\b(artist|genre|album|year|track|label|isrc|upc|tag):', '', query)
    # Remove single and double quotes
    q = q.replace("'", '').replace('"', '')
    # Collapse extra spaces
    return re.sub(r'\s+', ' ', q).strip()


async def search_tracks(query: str, market: str, limit: int = 10, offset: int = 0) -> list[dict]:
    clean_query = _sanitize_query(query)
    async with _search_semaphore:
        for attempt in range(3):
            try:
                headers = await _auth_headers()
                resp = await _get_client().get(
                    f"{_BASE}/search",
                    headers=headers,
                    params={"q": clean_query, "type": "track", "limit": min(limit, 10), "offset": offset},
                )
                if resp.status_code == 429:
                    retry_after = int(resp.headers.get("Retry-After", 2 ** (attempt + 1)))
                    await asyncio.sleep(min(retry_after, 10))
                    continue
                resp.raise_for_status()
                items = resp.json().get("tracks", {}).get("items", [])
                await asyncio.sleep(0.3)
                return items
            except Exception as exc:
                if attempt == 2:
                    raise
        return []


async def get_audio_features(ids: list[str]) -> dict[str, dict]:
    """Returns {track_id: features_dict}. Handles up to 100 IDs per request."""
    if not ids:
        return {}

    headers = await _auth_headers()
    result: dict[str, dict] = {}

    for i in range(0, len(ids), 100):
        chunk = ids[i : i + 100]
        resp = await _get_client().get(
            f"{_BASE}/audio-features",
            headers=headers,
            params={"ids": ",".join(chunk)},
        )
        resp.raise_for_status()
        for feat in resp.json().get("audio_features", []):
            if feat:
                result[feat["id"]] = feat

    return result


async def get_artist(artist_id: str) -> dict:
    headers = await _auth_headers()
    resp = await _get_client().get(f"{_BASE}/artists/{artist_id}", headers=headers)
    resp.raise_for_status()
    return resp.json()


async def get_top_tracks(artist_id: str, market: str = "US") -> list[dict]:
    headers = await _auth_headers()
    resp = await _get_client().get(
        f"{_BASE}/artists/{artist_id}/top-tracks",
        headers=headers,
        params={"market": market},
    )
    resp.raise_for_status()
    return resp.json().get("tracks", [])


async def get_related_artists(artist_id: str) -> list[dict]:
    headers = await _auth_headers()
    resp = await _get_client().get(
        f"{_BASE}/artists/{artist_id}/related-artists",
        headers=headers,
    )
    resp.raise_for_status()
    return resp.json().get("artists", [])


async def get_recommendations(
    seed_genres: list[str],
    targets: dict,
    market: str = "US",
    limit: int = 30,
) -> list[dict]:
    """Fallback if /search returns too few candidates."""
    headers = await _auth_headers()
    params: dict = {
        "seed_genres": ",".join(seed_genres[:5]),
        "market": market,
        "limit": limit,
    }
    for key, val in targets.items():
        params[key] = val

    resp = await _get_client().get(f"{_BASE}/recommendations", headers=headers, params=params)
    resp.raise_for_status()
    return resp.json().get("tracks", [])


async def exchange_code_for_token(code: str, redirect_uri: str) -> dict:
    """Exchange OAuth authorization code for access + refresh tokens."""
    client_id = os.getenv("SPOTIFY_CLIENT_ID", "")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET", "")
    credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

    resp = await _get_client().post(
        _AUTH_URL,
        headers={"Authorization": f"Basic {credentials}"},
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        },
    )
    resp.raise_for_status()
    return resp.json()


async def get_current_user(access_token: str) -> dict:
    resp = await _get_client().get(
        f"{_BASE}/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    resp.raise_for_status()
    return resp.json()


async def create_playlist(user_id: str, name: str, access_token: str) -> dict:
    resp = await _get_client().post(
        f"{_BASE}/users/{user_id}/playlists",
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        json={"name": name, "public": True},
    )
    resp.raise_for_status()
    return resp.json()


async def add_tracks_to_playlist(playlist_id: str, uris: list[str], access_token: str) -> None:
    resp = await _get_client().post(
        f"{_BASE}/playlists/{playlist_id}/tracks",
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        json={"uris": uris},
    )
    resp.raise_for_status()
