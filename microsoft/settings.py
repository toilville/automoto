from __future__ import annotations

from typing import Optional
from pydantic import Field, ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings for the generic Foundry starter."""

    model_config = ConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    run_mode: Optional[str] = Field(default=None)
    api_token: Optional[str] = Field(default=None)

    foundry_enabled: bool = Field(default=False)
    foundry_project_endpoint: Optional[str] = Field(default=None)
    foundry_subscription_id: Optional[str] = Field(default=None)
    foundry_resource_group: Optional[str] = Field(default=None)
    foundry_project_name: Optional[str] = Field(default=None)
    foundry_model_deployment: str = Field(default="gpt-4o")

    def validate_foundry_ready(self) -> bool:
        return all(
            [
                self.foundry_project_endpoint,
                self.foundry_subscription_id,
                self.foundry_resource_group,
                self.foundry_project_name,
            ]
        )

    def get_foundry_errors(self) -> list[str]:
        errors = []
        if not self.foundry_project_endpoint:
            errors.append("FOUNDRY_PROJECT_ENDPOINT not set")
        if not self.foundry_subscription_id:
            errors.append("FOUNDRY_SUBSCRIPTION_ID not set")
        if not self.foundry_resource_group:
            errors.append("FOUNDRY_RESOURCE_GROUP not set")
        if not self.foundry_project_name:
            errors.append("FOUNDRY_PROJECT_NAME not set")
        return errors
