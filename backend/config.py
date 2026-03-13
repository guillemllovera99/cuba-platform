import os

# Render provides postgres:// URLs, but asyncpg needs postgresql+asyncpg://
_raw_db_url = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://cuba:cuba_dev_123@localhost:5432/cuba",
)

# Convert postgres:// → postgresql+asyncpg://
if _raw_db_url.startswith("postgres://"):
    DATABASE_URL = _raw_db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _raw_db_url.startswith("postgresql://"):
    DATABASE_URL = _raw_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    DATABASE_URL = _raw_db_url

# Sync URL for any sync operations
DATABASE_URL_SYNC = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 1440  # 24 hours

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
