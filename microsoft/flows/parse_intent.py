from promptflow import tool
import re
from typing import Dict, Any


@tool
def parse_intent(user_message: str) -> Dict[str, Any]:
    message = user_message.lower()
    extracted_interests = ""

    patterns = [
        r"(?:interested in|about|regarding)\s+([^\.!?]+)",
        r"(?:looking for)\s+([^\.!?]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, message)
        if match:
            extracted_interests = match.group(1).strip()
            break

    if not extracted_interests:
        keywords = re.findall(r"\b(?:agents?|foundry|prompt flow|telemetry|deployment|security)\b", message)
        extracted_interests = ", ".join(sorted(set(keywords)))

    return {
        "intent": "recommend",
        "extracted_interests": extracted_interests,
    }
