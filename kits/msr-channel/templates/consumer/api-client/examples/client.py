"""
MSR Agent API Client — Python Example

Demonstrates calling the MSR Agent backend directly via REST API.
"""
import json
import os
import uuid
from datetime import datetime, timezone

import requests  # pip install requests

GATEWAY_URL = os.environ.get("MSR_GATEWAY_URL", "http://localhost:4000")
CHANNEL = "web"


def chat(user_message: str) -> dict:
    """Send a non-streaming chat request."""
    request_id = str(uuid.uuid4())

    payload = {
        "type": "chat",
        "requestId": request_id,
        "message": {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "context": {
            "channel": {"type": CHANNEL, "id": "python-client"},
            "conversation": {"id": f"conv-{request_id}", "history": []},
        },
        "stream": False,
    }

    response = requests.post(
        f"{GATEWAY_URL}/api/v1/{CHANNEL}",
        json=payload,
        headers={"Content-Type": "application/json"},
    )
    response.raise_for_status()
    return response.json()


def chat_stream(user_message: str) -> None:
    """Send a streaming chat request (SSE)."""
    request_id = str(uuid.uuid4())

    payload = {
        "type": "chat",
        "requestId": request_id,
        "message": {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "context": {
            "channel": {"type": CHANNEL, "id": "python-client"},
            "conversation": {"id": f"conv-{request_id}", "history": []},
        },
        "stream": True,
    }

    with requests.post(
        f"{GATEWAY_URL}/api/v1/{CHANNEL}",
        json=payload,
        headers={"Content-Type": "application/json"},
        stream=True,
    ) as response:
        response.raise_for_status()
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith("data: "):
                data = line[6:]
                if data == "[DONE]":
                    print("\n--- Stream complete ---")
                    return
                try:
                    event = json.loads(data)
                    if "delta" in event:
                        print(event["delta"], end="", flush=True)
                except json.JSONDecodeError:
                    pass


if __name__ == "__main__":
    print("=== Non-streaming ===")
    result = chat("What events are happening this month?")
    print("Response:", result["message"]["content"])
    print("Cards:", len(result.get("cards", [])))

    print("\n=== Streaming ===")
    chat_stream("Tell me about AI research at MSR")
