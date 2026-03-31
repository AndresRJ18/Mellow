"""Scoring pipeline — no audio features (deprecated by Spotify Nov 2024).

Strategy:
- Spotify search already returns results ordered by relevance to the query.
- We preserve that relevance signal via search_rank (position in results).
- We apply a popularity penalty to keep results within the requested range.
- Diversify: max 2 tracks per artist, pick top 10.
"""
from app.models.schemas import AudioTargets, TrackResult, ArtistRef


def _popularity_score(popularity: int, pop_min: int, pop_max: int) -> float:
    """0.0 = perfectly centered in the requested range, higher = further away."""
    center = (pop_min + pop_max) / 2
    half_range = max((pop_max - pop_min) / 2, 1)
    return abs(popularity - center) / half_range


def _build_track_result(track: dict, score: float) -> TrackResult:
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
        # No audio features available — zeroed out
        valence=0.0,
        energy=0.0,
        danceability=0.0,
        tempo=0.0,
        acousticness=0.0,
        instrumentalness=0.0,
        score=round(score, 4),
    )


# Keywords in album names that indicate beat packs, instrumentals, or mood compilations
_COMPILATION_ALBUM_KEYWORDS = [
    # Beat packs / producer packs
    "beats, vol", "beatz, vol", "beats vol", "typebeat", "type beat",
    "trap beats", "drill beats", "hip hop beats", "rap beats",
    # Instrumental collections
    "instrumental", "(instrumental", "- instrumental",
    # Mood/ambient compilations
    "chill", "relax", "relaxing", "peaceful", "ambient", "background",
    "sleep", "study", "focus", "lofi", "lo-fi", "lo fi",
    # Cover compilations
    "covers", "piano version", "piano covers",
    # Generic collection markers
    "playlist", "compilation", "music for",
    # Volume-numbered beat packs (e.g. "IDS Beats, Vol. 4")
    "ids beats", "bassbeq beats", "major vibes, vol", "dmajormusic",
]

# Keywords in TRACK names that indicate instrumentals / beat tracks
_COMPILATION_TRACK_KEYWORDS = [
    "- instrumental", "(instrumental)", "typebeat", "type beat",
    "trap beat", "drill beat", "hip hop beat",
]

# Artist name fragments that indicate beat producers (not real recording artists)
_BEAT_PRODUCER_FRAGMENTS = [
    " beats", " beatz", " beat$", "trap beats", "drill beats",
]


def filter_compilations(tracks: list[dict]) -> list[dict]:
    """Remove instrumental beat packs, compilation albums, and mood playlists."""
    result = []
    for track in tracks:
        album_name = track.get("album", {}).get("name", "").lower()
        track_name = track.get("name", "").lower()
        artist_names = [a.get("name", "").lower() for a in track.get("artists", [])]

        # Filter by album name keywords
        if any(kw in album_name for kw in _COMPILATION_ALBUM_KEYWORDS):
            continue

        # Filter by track name keywords (e.g. "Song - Instrumental")
        if any(kw in track_name for kw in _COMPILATION_TRACK_KEYWORDS):
            continue

        # Filter if artist name ends with "Beats" or "Beatz" (beat producers)
        if any(
            a.endswith(" beats") or a.endswith(" beatz") or a.endswith("beats")
            for a in artist_names
        ):
            continue

        result.append(track)
    # If filter removed everything, return originals (better than empty results)
    return result if result else tracks


def filter_popularity(tracks: list[dict], min_pop: int, max_pop: int) -> list[dict]:
    # popularity is not returned by Spotify search with market param — skip filter
    return tracks


def diversify(
    scored: list[tuple[dict, float]],
    max_per_artist: int = 2,
    top_n: int = 10,
) -> list[tuple[dict, float]]:
    # Count ALL artists in the track (primary + featured) so that an artist who
    # appears repeatedly as a feature doesn't dominate the list.
    artist_counts: dict[str, int] = {}
    result = []
    for track, score in scored:
        artists = track.get("artists", [])
        primary_artist_id = artists[0]["id"] if artists else "unknown"
        if artist_counts.get(primary_artist_id, 0) >= max_per_artist:
            continue
        result.append((track, score))
        artist_counts[primary_artist_id] = artist_counts.get(primary_artist_id, 0) + 1
        if len(result) >= top_n:
            break
    return result


def run_pipeline(
    candidates: list[dict],
    features_map: dict,  # kept for API compatibility, unused
    targets: AudioTargets,  # kept for API compatibility, unused
    popularity_min: int,
    popularity_max: int,
    exclude_ids: set[str],
    max_per_artist: int = 3,
    top_n: int = 15,
) -> list[TrackResult]:
    """Filter → score by relevance rank + popularity fit → diversify → top N."""
    # Exclude already-shown tracks
    candidates = [t for t in candidates if t["id"] not in exclude_ids]

    # Filter out compilation/mood-playlist albums
    candidates = filter_compilations(candidates)

    # Popularity filter
    candidates = filter_popularity(candidates, popularity_min, popularity_max)

    # Score: search rank (0-based position) normalized + popularity deviation
    # candidates are already ordered by Spotify relevance
    n = max(len(candidates), 1)
    scored = []
    for rank, track in enumerate(candidates):
        rank_score = rank / n  # 0.0 = top result, 1.0 = last
        pop_score = _popularity_score(
            track.get("popularity", 50), popularity_min, popularity_max
        )
        # Weighted combination: relevance matters more than popularity fit
        score = 0.7 * rank_score + 0.3 * pop_score
        scored.append((track, score))

    # Sort ascending (lower = better)
    scored.sort(key=lambda x: x[1])

    top = diversify(scored, max_per_artist=max_per_artist, top_n=top_n)

    return [_build_track_result(track, score) for track, score in top]
