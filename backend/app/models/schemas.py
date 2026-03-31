from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


# ── Bedrock / Analysis input ─────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    emotional_text: str = Field(..., min_length=1)
    music_taste_text: Optional[str] = None
    slider_tempo: int = Field(default=3, ge=1, le=5)
    slider_lyrics: int = Field(default=3, ge=1, le=5)
    slider_familiarity: int = Field(default=3, ge=1, le=5)


class SpotifySearch(BaseModel):
    query: str
    market: str = "US"
    weight: float


class YearFilter(BaseModel):
    active: bool
    from_year: Optional[int] = Field(None, alias="from")
    to_year: Optional[int] = Field(None, alias="to")

    model_config = {"populate_by_name": True}


class AudioTargets(BaseModel):
    target_valence: float
    target_energy: float
    target_danceability: float
    target_tempo: float
    target_acousticness: float
    target_instrumentalness: float


class PopularityRange(BaseModel):
    min: int
    max: int


class BedrockOutput(BaseModel):
    lectura: str
    mood_label: str
    spotify_searches: list[SpotifySearch]
    year_filter: YearFilter
    parametros_audio: AudioTargets
    popularity: PopularityRange
    paleta: list[str]
    tipografia_mood: str
    visual_keyword: str
    # Lift list — "when you're ready to move"
    lift_label: Optional[str] = None
    lift_lectura: Optional[str] = None
    lift_searches: Optional[list[SpotifySearch]] = None
    lift_parametros_audio: Optional[AudioTargets] = None


# ── Track result ──────────────────────────────────────────────────────────────

class ArtistRef(BaseModel):
    id: str
    name: str


class TrackResult(BaseModel):
    id: str
    name: str
    artists: list[ArtistRef]
    album_name: str
    release_year: str
    preview_url: Optional[str]
    spotify_url: str
    image_url: Optional[str]
    popularity: int
    # audio features
    valence: float
    energy: float
    danceability: float
    tempo: float
    acousticness: float
    instrumentalness: float
    # score
    score: float


# ── Analysis response ─────────────────────────────────────────────────────────

class AnalyzeResponse(BaseModel):
    tracks: list[TrackResult]
    lectura: str
    mood_label: str
    paleta: list[str]
    tipografia_mood: str
    visual_keyword: str
    current_targets: AudioTargets
    popularity: PopularityRange
    spotify_searches: list[SpotifySearch]
    # Lift list — "when you're ready to move"
    lift_tracks: list[TrackResult] = []
    lift_label: Optional[str] = None
    lift_lectura: Optional[str] = None
    lift_searches: list[SpotifySearch] = []


# ── Refinement ────────────────────────────────────────────────────────────────

class TrackFeatures(BaseModel):
    valence: float
    energy: float
    danceability: float
    tempo: float
    acousticness: float
    instrumentalness: float


class RoundState(BaseModel):
    round: int
    tracks: list[TrackResult]
    liked_ids: list[str]
    disliked_ids: list[str]
    more_like_this_id: Optional[str] = None
    liked_features: list[TrackFeatures]
    disliked_features: list[TrackFeatures]


class SessionState(BaseModel):
    session_id: str
    original_targets: AudioTargets
    current_targets: AudioTargets
    spotify_searches: list[SpotifySearch]
    lift_searches: list[SpotifySearch] = []
    popularity: PopularityRange
    rounds: list[RoundState]
    all_shown_ids: list[str]
    refinement_count: int


class RefineRequest(BaseModel):
    session_state: SessionState


class RefineResponse(BaseModel):
    tracks: list[TrackResult]
    new_targets: AudioTargets
    refinement_count: int
    lift_tracks: list[TrackResult] = []
    lift_label: Optional[str] = None
    lift_lectura: Optional[str] = None


# ── Artist panel ──────────────────────────────────────────────────────────────

class ArtistTopTracksResponse(BaseModel):
    tracks: list[TrackResult]


class RelatedArtist(BaseModel):
    id: str
    name: str
    image_url: Optional[str]


class RelatedArtistsResponse(BaseModel):
    artists: list[RelatedArtist]


class ArtistDetail(BaseModel):
    id: str
    name: str
    image_url: Optional[str]
    genres: list[str]
    popularity: int
    followers: int


# ── Playlist export ───────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    track_uris: list[str]
    mood_label: str
    access_token: str


class ExportResponse(BaseModel):
    playlist_id: str
    playlist_url: str
    name: str
