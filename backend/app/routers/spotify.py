import asyncio
import logging
from fastapi import APIRouter, Query

logger = logging.getLogger(__name__)
from app.models.schemas import (
    ArtistDetail,
    ArtistTopTracksResponse,
    RelatedArtistsResponse,
    RelatedArtist,
    TrackResult,
    ArtistRef,
)
from app.services import spotify as spotify_svc
from app.services import deezer as deezer_svc

router = APIRouter()


async def _enrich_previews(tracks: list[TrackResult]) -> list[TrackResult]:
    async def fill(track: TrackResult) -> TrackResult:
        if track.preview_url:
            return track
        artist_name = track.artists[0].name if track.artists else ""
        preview = await deezer_svc.search_preview(artist_name, track.name)
        if preview:
            return track.model_copy(update={"preview_url": preview})
        return track

    return list(await asyncio.gather(*[fill(t) for t in tracks]))


def _raw_to_track_result(track: dict) -> TrackResult:
    artists = [ArtistRef(id=a["id"], name=a["name"]) for a in track.get("artists", [])]
    images = track.get("album", {}).get("images", [])
    image_url = images[0]["url"] if images else None
    release_date = track.get("album", {}).get("release_date", "")
    release_year = release_date[:4] if release_date else ""
    return TrackResult(
        id=track["id"],
        name=track["name"],
        artists=artists,
        album_name=track.get("album", {}).get("name", ""),
        release_year=release_year,
        preview_url=track.get("preview_url"),
        spotify_url=track.get("external_urls", {}).get("spotify", ""),
        image_url=image_url,
        popularity=track.get("popularity", 0),
        valence=0.0,
        energy=0.0,
        danceability=0.0,
        tempo=0.0,
        acousticness=0.0,
        instrumentalness=0.0,
        score=0.0,
    )


@router.get("/artists/{artist_id}", response_model=ArtistDetail)
async def get_artist(artist_id: str) -> ArtistDetail:
    try:
        raw = await spotify_svc.get_artist(artist_id)
    except Exception as exc:
        logger.warning("get_artist failed for %s: %r", artist_id, exc)
        return ArtistDetail(id=artist_id, name="", image_url=None, genres=[], popularity=0, followers=0)
    images = raw.get("images", [])
    image_url = images[0]["url"] if images else None
    logger.warning("get_artist %s → image_url=%r images_count=%d", artist_id, image_url, len(images))
    followers = raw.get("followers", {}).get("total", 0)
    return ArtistDetail(
        id=raw["id"],
        name=raw["name"],
        image_url=image_url,
        genres=raw.get("genres", []),
        popularity=raw.get("popularity", 0),
        followers=followers,
    )


@router.get("/artists/{artist_id}/top-tracks", response_model=ArtistTopTracksResponse)
async def get_top_tracks(
    artist_id: str,
    market: str = Query(default="US"),
    artist_name: str = Query(default=""),
) -> ArtistTopTracksResponse:
    raw_tracks: list[dict] = []
    try:
        raw_tracks = await spotify_svc.get_top_tracks(artist_id, market)
    except Exception:
        pass  # fall through to search fallback below

    # Fall back to search if the endpoint is restricted or returned nothing
    if not raw_tracks and artist_name:
        raw_tracks = await spotify_svc.search_tracks(
            query=f'artist:"{artist_name}"',
            market=market,
            limit=10,
        )

    results = [_raw_to_track_result(t) for t in raw_tracks[:5]]
    enriched = await _enrich_previews(results)
    return ArtistTopTracksResponse(tracks=enriched)


@router.get("/artists/{artist_id}/related-artists", response_model=RelatedArtistsResponse)
async def get_related_artists(artist_id: str) -> RelatedArtistsResponse:
    try:
        raw = await spotify_svc.get_related_artists(artist_id)
    except Exception:
        # /related-artists is restricted for new Spotify apps — return empty gracefully
        return RelatedArtistsResponse(artists=[])
    artists = []
    for a in raw[:5]:
        images = a.get("images", [])
        image_url = images[0]["url"] if images else None
        artists.append(RelatedArtist(id=a["id"], name=a["name"], image_url=image_url))
    return RelatedArtistsResponse(artists=artists)
