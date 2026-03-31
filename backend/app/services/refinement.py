from app.models.schemas import AudioTargets, TrackFeatures

_FLOAT_PARAMS = [
    "target_valence",
    "target_energy",
    "target_danceability",
    "target_acousticness",
    "target_instrumentalness",
]

# Maps target key -> features dict key
_TARGET_TO_FEAT = {p: p.replace("target_", "") for p in _FLOAT_PARAMS}


def average_features(features_list: list[TrackFeatures]) -> dict:
    if not features_list:
        return {}
    keys = ["valence", "energy", "danceability", "tempo", "acousticness", "instrumentalness"]
    totals = {k: 0.0 for k in keys}
    for f in features_list:
        for k in keys:
            totals[k] += getattr(f, k)
    n = len(features_list)
    return {k: totals[k] / n for k in keys}


def clamp_all(targets: dict) -> dict:
    for p in _FLOAT_PARAMS:
        targets[p] = max(0.0, min(1.0, targets[p]))
    targets["target_tempo"] = max(40.0, min(220.0, targets["target_tempo"]))
    return targets


def refine_targets(
    current: AudioTargets,
    liked_features: list[TrackFeatures],
    disliked_features: list[TrackFeatures],
    more_like_this: TrackFeatures | None,
) -> AudioTargets:
    """Adjust audio targets based on user feedback signals."""
    targets = current.model_dump()

    # more_like_this: strongest signal, 60/40 blend toward that track
    if more_like_this:
        feat = more_like_this.model_dump()
        for p in _FLOAT_PARAMS:
            k = _TARGET_TO_FEAT[p]
            targets[p] = feat[k] * 0.6 + targets[p] * 0.4
        targets["target_tempo"] = feat["tempo"] * 0.6 + targets["target_tempo"] * 0.4

    # Liked tracks: pull targets 30% toward average liked features
    if liked_features:
        avg = average_features(liked_features)
        for p in _FLOAT_PARAMS:
            k = _TARGET_TO_FEAT[p]
            targets[p] += (avg[k] - targets[p]) * 0.3
        targets["target_tempo"] += (avg["tempo"] - targets["target_tempo"]) * 0.3

    # Disliked tracks: push targets 20% away from average disliked features
    if disliked_features:
        avg = average_features(disliked_features)
        for p in _FLOAT_PARAMS:
            k = _TARGET_TO_FEAT[p]
            targets[p] -= (avg[k] - targets[p]) * 0.2
        targets["target_tempo"] -= (avg["tempo"] - targets["target_tempo"]) * 0.2

    targets = clamp_all(targets)
    return AudioTargets(**targets)
