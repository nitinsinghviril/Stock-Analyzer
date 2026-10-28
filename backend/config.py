import os


def _split(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


ENV = os.getenv("ENV", "development")
ALLOWED_ORIGINS = _split(os.getenv("ALLOWED_ORIGINS", "http://localhost:5173"))
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "300"))
