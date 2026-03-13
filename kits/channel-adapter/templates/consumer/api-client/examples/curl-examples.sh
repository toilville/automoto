#!/usr/bin/env bash
# MSR Agent API Client — curl examples
#
# Usage:
#   GATEWAY_URL=http://localhost:4000 ./curl-examples.sh

GATEWAY_URL="${MSR_GATEWAY_URL:-http://localhost:4000}"
CHANNEL="web"
REQUEST_ID=$(uuidgen 2>/dev/null || python3 -c "import uuid; print(uuid.uuid4())")

echo "=== Non-streaming request ==="
curl -s -X POST "${GATEWAY_URL}/api/v1/${CHANNEL}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "chat",
    "requestId": "'"${REQUEST_ID}"'",
    "message": {
      "id": "msg-001",
      "role": "user",
      "content": "What events are happening this month?",
      "timestamp": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"
    },
    "context": {
      "channel": { "type": "'"${CHANNEL}"'", "id": "curl-example" },
      "conversation": { "id": "conv-curl-001", "history": [] }
    },
    "stream": false
  }' | python3 -m json.tool

echo ""
echo "=== Streaming request (SSE) ==="
curl -s -N -X POST "${GATEWAY_URL}/api/v1/${CHANNEL}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "chat",
    "requestId": "'"${REQUEST_ID}-stream"'",
    "message": {
      "id": "msg-002",
      "role": "user",
      "content": "Tell me about AI research",
      "timestamp": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"
    },
    "context": {
      "channel": { "type": "'"${CHANNEL}"'", "id": "curl-example" },
      "conversation": { "id": "conv-curl-002", "history": [] }
    },
    "stream": true
  }'
