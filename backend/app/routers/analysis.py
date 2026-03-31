import asyncio
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    AudioTargets,
    PopularityRange,
    SpotifySearch,
    TrackResult,
)
from app.services import bedrock as bedrock_svc
from app.services import spotify as spotify_svc
from app.services import deezer as deezer_svc
from app.services.scoring import run_pipeline

router = APIRouter()


async def _enrich_previews(tracks: list[TrackResult]) -> list[TrackResult]:
    """Fill in missing preview_url from Deezer for tracks that Spotify left without one."""
    async def fill(track: TrackResult) -> TrackResult:
        if track.preview_url:
            return track
        artist_name = track.artists[0].name if track.artists else ""
        preview = await deezer_svc.search_preview(artist_name, track.name)
        if preview:
            return track.model_copy(update={"preview_url": preview})
        return track

    return list(await asyncio.gather(*[fill(t) for t in tracks]))


async def _search_candidates(searches: list[SpotifySearch], total_slots: int) -> list[dict]:
    """Run Spotify searches sequentially to avoid rate limits."""
    tasks = []
    for s in searches[:3]:
        tasks.append(spotify_svc.search_tracks(query=s.query, market=s.market, limit=50, offset=0))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    candidates: list[dict] = []
    seen_ids: set[str] = set()
    seen_song_keys: set[tuple[str, str]] = set()
    for s, result in zip(searches, results):
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


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    if len(req.emotional_text.split()) < 5:
        raise HTTPException(status_code=422, detail="emotional_text must be at least 5 words")

    # Step 1 — Bedrock
    try:
        bedrock_data = await bedrock_svc.call_nova_lite(
            emotional_text=req.emotional_text,
            music_taste_text=req.music_taste_text,
            slider_tempo=req.slider_tempo,
            slider_lyrics=req.slider_lyrics,
            slider_familiarity=req.slider_familiarity,
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    searches = [SpotifySearch(**s) for s in bedrock_data["spotify_searches"]]
    targets = AudioTargets(**bedrock_data["parametros_audio"])
    popularity = PopularityRange(**bedrock_data["popularity"])

    # Parse lift fields (optional — Bedrock may not always return them)
    lift_searches_raw = bedrock_data.get("lift_searches") or []
    lift_parametros_raw = bedrock_data.get("lift_parametros_audio")
    lift_label = bedrock_data.get("lift_label")
    lift_lectura = bedrock_data.get("lift_lectura")

    lift_searches = [SpotifySearch(**s) for s in lift_searches_raw] if lift_searches_raw else []
    lift_targets = AudioTargets(**lift_parametros_raw) if lift_parametros_raw else None

    # Step 2 — Run main and lift Spotify searches in parallel
    async def _empty() -> list:
        return []

    main_candidates_task = _search_candidates(searches[:3], total_slots=10)
    lift_candidates_task = (
        _search_candidates(lift_searches[:2], total_slots=10)
        if lift_searches else _empty()
    )
    main_candidates, lift_candidates_raw = await asyncio.gather(
        main_candidates_task, lift_candidates_task
    )

    if not main_candidates:
        raise HTTPException(status_code=404, detail="No tracks found for this mood")

    # Step 3 — Score main list
    main_tracks_raw = run_pipeline(
        candidates=main_candidates,
        features_map={},
        targets=targets,
        popularity_min=popularity.min,
        popularity_max=popularity.max,
        exclude_ids=set(),
    )

    if not main_tracks_raw:
        raise HTTPException(status_code=404, detail="No matching tracks found for this mood")

    # Step 4 — Score lift list (exclude IDs already in main list)
    main_ids = {t.id for t in main_tracks_raw}
    lift_tracks_raw: list = []
    if lift_candidates_raw and lift_targets:
        lift_tracks_raw = run_pipeline(
            candidates=lift_candidates_raw,
            features_map={},
            targets=lift_targets,
            popularity_min=popularity.min,
            popularity_max=popularity.max,
            exclude_ids=main_ids,
        )
        # Lift shows up to 12 tracks
        lift_tracks_raw = lift_tracks_raw[:12]

    # Step 5 — Enrich both lists with Deezer previews in parallel
    main_enriched, lift_enriched = await asyncio.gather(
        _enrich_previews(main_tracks_raw),
        _enrich_previews(lift_tracks_raw),
    )

    return AnalyzeResponse(
        tracks=main_enriched,
        lectura=bedrock_data["lectura"],
        mood_label=bedrock_data["mood_label"],
        paleta=bedrock_data["paleta"],
        tipografia_mood=bedrock_data["tipografia_mood"],
        visual_keyword=bedrock_data["visual_keyword"],
        current_targets=targets,
        popularity=popularity,
        spotify_searches=searches,
        lift_tracks=lift_enriched,
        lift_label=lift_label,
        lift_lectura=lift_lectura,
        lift_searches=lift_searches,
    )
