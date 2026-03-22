"""
LLM client abstraction.

Design goals:
- Keep all model-provider-specific logic in one place.
- Allow services to depend on `AIClient` instead of a concrete provider.
- Fail fast if the API key is missing (so demos don't silently return fake output).
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Literal

from openai import OpenAI

from app.core.config import settings


class AIClient(ABC):
    """
    Minimal interface for text generation.

    Services build prompts and call `generate()`.
    The returned string is then parsed (JSON) or post-processed downstream.
    """

    @abstractmethod
    def generate(self, prompt: str, system_prompt: str | None = None) -> str:
        """Generates text based on a prompt."""
        pass


Provider = Literal["openai", "deepseek"]


@dataclass(frozen=True)
class LLMConfig:
    provider: Provider
    api_key: str
    model: str
    base_url: str | None = None


def _resolve_llm_config() -> LLMConfig:
    provider = (settings.LLM_PROVIDER or "openai").strip().lower()
    if provider not in {"openai", "deepseek"}:
        provider = "openai"

    api_key = settings.LLM_API_KEY or settings.OPENAI_API_KEY
    model = settings.LLM_MODEL or settings.OPENAI_MODEL
    base_url = settings.LLM_BASE_URL

    if not api_key:
        raise RuntimeError("LLM_API_KEY is not configured")
    if not model:
        raise RuntimeError("LLM_MODEL is not configured")

    return LLMConfig(provider=provider, api_key=api_key, model=model, base_url=base_url)


class OpenAICompatibleClient(AIClient):
    def __init__(self, config: LLMConfig):
        self.config = config
        if config.base_url:
            self.client = OpenAI(api_key=config.api_key, base_url=config.base_url)
        else:
            self.client = OpenAI(api_key=config.api_key)

    def generate(self, prompt: str, system_prompt: str | None = None) -> str:
        """
        Calls OpenAI Chat Completions and returns the assistant message content.

        Raises:
        - RuntimeError if the API key is missing
        - Any OpenAI exception if the call fails
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})

        try:
            response = self.client.chat.completions.create(
                model=self.config.model,
                messages=messages,
                temperature=0.7,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            raise e


def get_default_ai_client() -> AIClient:
    config = _resolve_llm_config()
    return OpenAICompatibleClient(config)


class OpenAIClient(OpenAICompatibleClient):
    def __init__(self, api_key: str | None = None, model: str | None = None):
        cfg = _resolve_llm_config()
        override_key = api_key or cfg.api_key
        override_model = model or cfg.model
        super().__init__(LLMConfig(provider=cfg.provider, api_key=override_key, model=override_model, base_url=cfg.base_url))
