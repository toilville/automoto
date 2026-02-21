from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, Optional

from microsoft import core
from microsoft.settings import Settings


class AdapterType(str, Enum):
    FOUNDRY = "foundry"
    BOT = "bot"
    POWER = "power"


@dataclass
class ToolDefinition:
    name: str
    description: str
    parameters: Dict[str, Any]


class UnifiedAdapter(ABC):
    def __init__(self, adapter_type: AdapterType, settings: Optional[Settings] = None):
        self.adapter_type = adapter_type
        self.settings = settings or Settings()
        self.tools: Dict[str, ToolDefinition] = {
            "recommend": ToolDefinition(
                name="recommend",
                description="Recommend catalog items based on user interests.",
                parameters={
                    "type": "object",
                    "properties": {
                        "interests": {"type": "array", "items": {"type": "string"}},
                        "top": {"type": "integer", "minimum": 1, "maximum": 10},
                    },
                    "required": ["interests"],
                },
            ),
            "explain": ToolDefinition(
                name="explain",
                description="Explain why a catalog item is relevant.",
                parameters={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "interests": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["title", "interests"],
                },
            ),
        }

    def handle_tool_call(self, tool_name: str, parameters: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        tool = self.tools.get(tool_name)
        if not tool:
            return {"status": "error", "error": f"Unknown tool: {tool_name}"}

        validated = self._validate_parameters(tool, parameters)
        if tool_name == "recommend":
            result = core.recommend(validated.get("interests", []), int(validated.get("top", 3)))
            return self._transform_response(tool, {"status": "success", "result": result}, context)

        explanation = core.explain(validated["title"], validated.get("interests", []))
        return self._transform_response(tool, {"status": "success", "result": {"explanation": explanation}}, context)

    @abstractmethod
    def _validate_parameters(self, tool: ToolDefinition, parameters: Dict[str, Any]) -> Dict[str, Any]:
        ...

    @abstractmethod
    def _transform_response(
        self,
        tool: ToolDefinition,
        result: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        ...
