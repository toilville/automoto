from __future__ import annotations

from typing import Any, Dict, Optional

from microsoft.adapters.base_adapter import AdapterType, ToolDefinition, UnifiedAdapter
from microsoft.settings import Settings

try:
    from agent_framework_azure_ai import AzureAIAgent
    from agent_framework import Agent, Tool, RunContext
    from azure.identity import DefaultAzureCredential

    HAS_AGENT_FRAMEWORK = True
except ImportError:
    HAS_AGENT_FRAMEWORK = False


class FoundryAdapter(UnifiedAdapter):
    """Foundry adapter for the generic starter."""

    def __init__(
        self,
        project_endpoint: Optional[str] = None,
        credential: Optional[Any] = None,
        model_deployment: str = "gpt-4o",
        settings: Optional[Settings] = None,
    ):
        super().__init__(AdapterType.FOUNDRY, settings=settings)
        self.project_endpoint = project_endpoint or self.settings.foundry_project_endpoint
        self.credential = credential
        self.model_deployment = model_deployment
        self.agent: Optional["Agent"] = None

        if HAS_AGENT_FRAMEWORK and self.project_endpoint:
            self.agent = self._create_agent()

    def _create_agent(self) -> Optional["Agent"]:
        if not HAS_AGENT_FRAMEWORK:
            return None

        credential = self.credential or DefaultAzureCredential()
        tools = [
            Tool(
                name=tool.name,
                description=tool.description,
                parameters=tool.parameters,
                handler=lambda params, ctx, t=tool: self.handle_tool_call(t.name, params, ctx),
            )
            for tool in self.tools.values()
        ]

        return AzureAIAgent(
            project_endpoint=self.project_endpoint,
            credential=credential,
            model_deployment=self.model_deployment,
            tools=tools,
        )

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
            "status": result.get("status", "success"),
            "adapter": "foundry",
            "tool": tool.name,
            "content": result.get("result"),
            "context": context or {},
        }

    async def run(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.agent:
            return {
                "status": "error",
                "error": "Foundry agent runtime unavailable. Install agent-framework-azure-ai and set FOUNDRY_PROJECT_ENDPOINT.",
            }

        run_context = RunContext(message=message, context=context or {})
        response = await self.agent.run(run_context)
        return {"status": "success", "response": response}
