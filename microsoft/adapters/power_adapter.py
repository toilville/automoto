from __future__ import annotations

from typing import Any, Dict, Optional

from microsoft.adapters.base_adapter import AdapterType, ToolDefinition, UnifiedAdapter


class PowerAdapter(UnifiedAdapter):
    """Generic Power Platform style adapter output."""

    def __init__(self):
        super().__init__(AdapterType.POWER)

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
            "Status": result.get("status", "success"),
            "Tool": tool.name,
            "Result": result.get("result"),
            "Adapter": "power",
        }
