import os


def _get_env(name: str) -> str | None:
    """Get env var, treating empty string same as missing."""
    val = os.getenv(name)
    return val if val else None


def _to_asyncpg_url(url: str) -> str:
    """Convert any postgres URL variant to the postgresql+asyncpg:// format."""
    if url.startswith("postgresql+asyncpg://"):
        return url
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + url[len("postgresql://"):]
    return url


# ---------------------------------------------------------------------------
# DATABASE_URL resolution
# ---------------------------------------------------------------------------
# Railway can set DATABASE_URL, DATABASE_PRIVATE_URL, or DATABASE_PUBLIC_URL.
# Any of them might be empty strings (reference not yet resolved), so we
# treat empty the same as missing and check each one in order.
_cloud_db_url = (
    _get_env("DATABASE_URL")
    or _get_env("DATABASE_PRIVATE_URL")
    or _get_env("DATABASE_PUBLIC_URL")
)

# Detect if we're running on Railway (RAILWAY_ENVIRONMENT is always set)
_ON_RAILWAY = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PROJECT_ID"))

if _cloud_db_url:
    # Cloud DB URL found — convert to asyncpg format
    DATABASE_URL = _to_asyncpg_url(_cloud_db_url)
    print(f"Database: using cloud URL (host: {DATABASE_URL.split('@')[1].split('/')[0] if '@' in DATABASE_URL else 'unknown'})")
elif _ON_RAILWAY:
    # On Railway but no DB URL — service will start, DB endpoints won't work
    DATABASE_URL = ""
    print(
        "WARNING: Running on Railway but no DATABASE_URL found. "
        "Make sure a Postgres plugin is attached and its DATABASE_URL "
        "variable is linked to this service."
    )
else:
    # Local development fallback
    DATABASE_URL = "postgresql+asyncpg://cuba:cuba_dev_123@localhost:5432/cuba"
    print("Database: using local development default (localhost:5432)")

DATABASE_URL_SYNC = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1) if DATABASE_URL else ""

# ---------------------------------------------------------------------------
# Other settings
# ---------------------------------------------------------------------------
JWT_SECRET = _get_env("JWT_SECRET") or "dev-secret-change-in-prod"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 1440  # 24 hours

CORS_ORIGINS = (_get_env("CORS_ORIGINS") or "*").split(",")
