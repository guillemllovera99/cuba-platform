import os

# Railway provides DATABASE_URL or DATABASE_PRIVATE_URL.
# The URL format can be postgres://, postgresql://, or already postgresql+asyncpg://.
# asyncpg requires the postgresql+asyncpg:// scheme.
_raw_db_url = os.getenv(
    "DATABASE_URL",
    os.getenv(
        "DATABASE_PRIVATE_URL",
        "postgresql+asyncpg://cuba:cuba_dev_123@localhost:5432/cuba",
    ),
)


def _to_asyncpg_url(url: str) -> str:
    """Convert any postgres URL variant to the postgresql+asyncpg:// format."""
    if url.startswith("postgresql+asyncpg://"):
        return url  # already correct
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + url[len("postgresql://"):]
    # Unknown scheme — return as-is and let SQLAlchemy raise a clear error
    return url


DATABASE_URL = _to_asyncpg_url(_raw_db_url)

# Sync URL for any sync operations (alembic, etc.)
DATABASE_URL_SYNC = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 1440  # 24 hours

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
