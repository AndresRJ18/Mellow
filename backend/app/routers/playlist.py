import os
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from app.models.schemas import ExportRequest, ExportResponse
from app.services import spotify as spotify_svc

router = APIRouter()

_SCOPES = "playlist-modify-public playlist-modify-private"


@router.get("/auth/login")
async def spotify_login() -> RedirectResponse:
    """Redirect user to Spotify authorization page."""
    client_id = os.getenv("SPOTIFY_CLIENT_ID", "")
    redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:8000/auth/callback")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

    auth_url = (
        "https://accounts.spotify.com/authorize"
        f"?client_id={client_id}"
        f"&response_type=code"
        f"&redirect_uri={redirect_uri}"
        f"&scope={_SCOPES.replace(' ', '%20')}"
        f"&show_dialog=true"
    )
    return RedirectResponse(url=auth_url)


@router.get("/auth/callback")
async def spotify_callback(
    code: str = Query(...),
    error: str = Query(default=None),
) -> RedirectResponse:
    """Exchange authorization code for access token, redirect to frontend."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:8000/auth/callback")

    if error:
        return RedirectResponse(url=f"{frontend_url}?auth_error={error}")

    try:
        token_data = await spotify_svc.exchange_code_for_token(code, redirect_uri)
        access_token = token_data["access_token"]
    except Exception as exc:
        return RedirectResponse(url=f"{frontend_url}?auth_error=token_exchange_failed")

    # Pass token to frontend via URL fragment (stays client-side, not logged by servers)
    return RedirectResponse(url=f"{frontend_url}/auth/callback#access_token={access_token}")


@router.post("/playlist/export", response_model=ExportResponse)
async def export_playlist(req: ExportRequest) -> ExportResponse:
    """Create a Spotify playlist and add the selected tracks."""
    try:
        user = await spotify_svc.get_current_user(req.access_token)
        user_id = user["id"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired Spotify access token")

    playlist_name = f"{req.mood_label} — Mellow"

    try:
        playlist = await spotify_svc.create_playlist(user_id, playlist_name, req.access_token)
        playlist_id = playlist["id"]
        playlist_url = playlist["external_urls"]["spotify"]
    except Exception as exc:
        import traceback; traceback.print_exc()
        msg = str(exc)
        status = 403 if "403" in msg else 502
        detail = "insufficient_scope" if "403" in msg else f"Failed to create playlist: {exc}"
        raise HTTPException(status_code=status, detail=detail)

    try:
        await spotify_svc.add_tracks_to_playlist(playlist_id, req.track_uris, req.access_token)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to add tracks: {exc}")

    return ExportResponse(
        playlist_id=playlist_id,
        playlist_url=playlist_url,
        name=playlist_name,
    )
