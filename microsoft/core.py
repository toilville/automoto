from __future__ import annotations

import json
import pathlib
from typing import Any, Dict, List

MANIFEST_PATH = pathlib.Path(__file__).parent / "agent.json"


def load_manifest(path: pathlib.Path = MANIFEST_PATH) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_interests(raw: str) -> List[str]:
    if not raw:
        return []
    norm = raw.replace(";", ",").lower()
    return [item.strip() for item in norm.split(",") if item.strip()]


def score_item(item: Dict[str, Any], interests: List[str], weights: Dict[str, float]) -> Dict[str, Any]:
    tags = [str(tag).lower() for tag in item.get("tags", [])]
    interest_hits = sum(1 for tag in tags if tag in interests)
    popularity_component = float(item.get("popularity", 0)) * weights["popularity"]
    diversity_component = len(set(interests)) * 0.01 * weights["diversity"]

    contributions = {
        "interest_match": interest_hits * weights["interest"],
        "popularity": popularity_component,
        "diversity": diversity_component,
    }
    return {"item": item, "score": sum(contributions.values()), "contributions": contributions}


def recommend(interests: List[str], top: int = 3, manifest_path: str | None = None) -> List[Dict[str, Any]]:
    manifest = load_manifest(pathlib.Path(manifest_path) if manifest_path else MANIFEST_PATH)
    weights = manifest.get("weights", {"interest": 2.0, "popularity": 0.5, "diversity": 0.3})
    catalog = manifest.get("items", [])

    ranked = sorted(
        [score_item(item, interests, weights) for item in catalog],
        key=lambda entry: entry["score"],
        reverse=True,
    )[:top]

    return [
        {
            "id": row["item"].get("id"),
            "title": row["item"].get("title"),
            "summary": row["item"].get("summary", ""),
            "tags": row["item"].get("tags", []),
            "score": row["score"],
            "contributions": row["contributions"],
        }
        for row in ranked
    ]


def explain(session_title: str, interests: List[str], manifest_path: str | None = None) -> str:
    manifest = load_manifest(pathlib.Path(manifest_path) if manifest_path else MANIFEST_PATH)
    catalog = manifest.get("items", [])
    item = next((entry for entry in catalog if entry.get("title", "").lower() == session_title.lower()), None)
    if not item:
        return f"No item named '{session_title}' was found in the current catalog."

    tags = [str(tag).lower() for tag in item.get("tags", [])]
    matched = [tag for tag in tags if tag in interests]
    if not matched:
        return f"{item['title']} is available, but it does not directly match your current interests."

    return (
        f"{item['title']} matches your interests in {', '.join(matched)}. "
        f"It is relevant because its tags overlap with your requested topics."
    )
