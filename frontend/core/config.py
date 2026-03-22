"""
Central configuration (environment variables).

This project uses Pydantic Settings to load configuration from:
- environment variables
- and `.env` in the repository root (demo/dev convenience)

Important settings:
- OPENAI_API_KEY: enables real LLM calls (no key -> endpoints return 503)
- OPENAI_MODEL: model name (defaults to gpt-4o)
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core
    PROJECT_NAME: str = "AI Outreach System"
    API_V1_STR: str = "/api/v1"

    # LLM (generic)
    LLM_PROVIDER: str = "openai"
    LLM_API_KEY: str | None = None
    LLM_MODEL: str | None = None
    LLM_BASE_URL: str | None = None

    # OpenAI (legacy, kept for backward compatibility)
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o"  # Default to GPT-4o, can be overridden

    # Email (SMTP/IMAP)
    EMAIL_SMTP_HOST: str = "smtp.exmail.qq.com"
    EMAIL_SMTP_PORT: int = 465
    EMAIL_IMAP_HOST: str = "imap.exmail.qq.com"
    EMAIL_IMAP_PORT: int = 993
    EMAIL_USERNAME: str | None = None
    EMAIL_PASSWORD: str | None = None

    # Tracking
    TRACK_BASE_URL: str = "http://localhost:8000"
    MESSAGE_ID_DOMAIN: str = "yourdomain.com"


settings = Settings()
