from __future__ import annotations

from typing import Any, Dict, Optional

from microsoft.adapters.base_adapter import AdapterType, ToolDefinition, UnifiedAdapter


class BotAdapter(UnifiedAdapter):
    """Generic Bot-channel adapter that reuses unified tool handling."""

    def __init__(self):
        super().__init__(AdapterType.BOT)

    def _validate_parameters(self, tool: ToolDefinition, parameters: Dict[str, Any]) -> Dict[str, Any]:
        required = tool.parameters.get("required", [])
        for field in required:
            if field not in parameters:
                raise ValueError(f"Missing required parameter: {field}")
        return parameters

    def _transform_response(
        self,
        tool: ToolDefinition,
        result: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return {
            "type": "message",
            "channel": "bot",
            "tool": tool.name,
            "payload": result.get("result"),
            "status": result.get("status", "success"),
        }
