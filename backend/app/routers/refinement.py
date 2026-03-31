import asyncio
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    RefineRequest, RefineResponse, TrackResult, SpotifySearch,
)
from app.services import spotify as spotify_svc
from app.services import deezer as deezer_svc
from app.services.scoring import run_pipeline

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


async def _fetch_candidates(searches: list[SpotifySearch], base_slots: int = 30) -> list[dict]:
    """
    Run searches in parallel. For high-weight queries (liked artist), run two
    offsets so we get enough candidates even after excluding already-shown tracks.
    """
    tasks = []
    for s in searches:
        limit = min(50, max(20, int(base_slots * s.weight)))
        tasks.append(spotify_svc.search_tracks(query=s.query, market=s.market, limit=limit, offset=0))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    candidates: list[dict] = []
    seen_ids: set[str] = set()
    seen_song_keys: set[tuple] = set()
    for result in results:
        if isinstance(result, Exception):
            continue
        for track in result:
            if track["id"] in seen_ids:
                continue
            primary_artist_id = track["artists"][0]["id"] if track.get("artists") else ""
            song_key = (track["name"].lower(), primary_artist_id)
            if song_key in seen_song_keys:
                continue
            seen_ids.add(track["id"])
            seen_song_keys.add(song_key)
            candidates.append(track)
    return candidates


def _build_refined_searches(
    session,
    max_artist_queries: int = 2,
) -> tuple[list[SpotifySearch], int]:
    """
    Build artist-boosted queries for the main refinement list.

    Weight scales with how concentrated the likes are on one artist:
    - All likes on one artist → artist gets ~80% weight
    - Likes spread across two artists equally → 60% split between them
    - Remaining weight goes to original genre queries for variety

    Returns (queries, max_per_artist_for_pipeline).
    """
    artist_likes: dict[str, tuple[str, int]] = {}  # artist_id -> (name, like_count)
    default_market = session.spotify_searches[0].market if session.spotify_searches else "US"
    total_likes = 0

    for round_data in session.rounds:
        track_map = {t.id: t for t in round_data.tracks}
        for track_id in round_data.liked_ids:
            track = track_map.get(track_id)
            if track and track.artists:
                artist = track.artists[0]
                name, count = artist_likes.get(artist.id, (artist.name, 0))
                artist_likes[artist.id] = (artist.name, count + 1)
                total_likes += 1

    if not artist_likes:
        return session.spotify_searches, 3

    top_artists = sorted(artist_likes.values(), key=lambda x: x[1], reverse=True)[:max_artist_queries]
    top_likes = sum(c for _, c in top_artists)

    # Artist weight: 0.5 (spread) → 0.8 (all same artist)
    concentration = top_likes / max(total_likes, 1)
    total_artist_weight = 0.5 + concentration * 0.3

    artist_queries = [
        SpotifySearch(
            query=f'artist:"{name}"',
            market=default_market,
            weight=round(total_artist_weight * (count / top_likes), 3),
        )
        for name, count in top_artists
    ]

    # Fill remaining weight with original genre queries for variety
    remaining_weight = round(1.0 - total_artist_weight, 3)
    n_orig = min(2, len(session.spotify_searches))
    original_queries = []
    if n_orig > 0 and remaining_weight > 0:
        orig_weight = round(remaining_weight / n_orig, 3)
        original_queries = [
            SpotifySearch(query=s.query, market=s.market, weight=orig_weight)
            for s in session.spotify_searches[:n_orig]
        ]

    # Allow more tracks per artist proportionally to how concentrated the likes are
    # concentration=1.0 → max 7, concentration=0.5 → max 4
    max_per_artist = 3 + round(concentration * 4)

    return artist_queries + original_queries, max_per_artist


@router.post("/refine", response_model=RefineResponse)
async def refine(req: RefineRequest) -> RefineResponse:
    session = req.session_state

    if session.refinement_count >= 10:
        raise HTTPException(status_code=400, detail="Maximum refinement rounds reached")

    effective_searches, max_per_artist = _build_refined_searches(session)
    exclude_ids = set(session.all_shown_ids)

    # Fetch main candidates and lift candidates in parallel
    lift_task = (
        _fetch_candidates(session.lift_searches, base_slots=30)
        if session.lift_searches else asyncio.sleep(0, result=[])
    )
    main_candidates, lift_candidates_raw = await asyncio.gather(
        _fetch_candidates(effective_searches, base_slots=45),
        lift_task,
    )

    # Score main tracks
    tracks = run_pipeline(
        candidates=main_candidates,
        features_map={},
        targets=session.current_targets,
        popularity_min=session.popularity.min,
        popularity_max=session.popularity.max,
        exclude_ids=exclude_ids,
        max_per_artist=max_per_artist,
    )

    if not tracks:
        raise HTTPException(status_code=404, detail="No new matching tracks found")

    # Score lift tracks — exclude already-shown IDs AND new main tracks
    main_ids = {t.id for t in tracks}
    lift_tracks_raw = run_pipeline(
        candidates=lift_candidates_raw,
        features_map={},
        targets=session.current_targets,
        popularity_min=session.popularity.min,
        popularity_max=session.popularity.max,
        exclude_ids=exclude_ids | main_ids,
        max_per_artist=3,
        top_n=12,
    ) if lift_candidates_raw else []

    # Enrich both lists with previews in parallel
    tracks, lift_tracks = await asyncio.gather(
        _enrich_previews(tracks),
        _enrich_previews(lift_tracks_raw),
    )

    return RefineResponse(
        tracks=tracks,
        new_targets=session.current_targets,
        refinement_count=session.refinement_count + 1,
        lift_tracks=lift_tracks,
    )
