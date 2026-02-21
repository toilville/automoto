from promptflow import tool
from typing import Dict, Any

from microsoft import core


@tool
def get_recommendations(interests: str, user_interests: str = "") -> Dict[str, Any]:
    combined = interests or user_interests
    if not combined:
        return {"success": False, "recommendations": [], "error": "No interests provided"}

    values = core.normalize_interests(combined)
    recommendations = core.recommend(interests=values, top=5)
    return {
        "success": True,
        "interests": values,
        "recommendations": recommendations,
    }
