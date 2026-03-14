from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import DATABASE_URL

# --- Lazy engine creation ---------------------------------------------------
# On Railway, DATABASE_URL may be empty at import time (env var not yet
# resolved). Creating an engine with an empty string crashes immediately.
# Instead, we create the engine lazily on first use.

_engine = None
_async_session = None


def _get_engine():
    global _engine
    if _engine is None:
        if not DATABASE_URL:
            raise RuntimeError(
                "DATABASE_URL is not configured. "
                "Set it as an environment variable (Railway injects this automatically "
                "when a Postgres plugin is attached to the service)."
            )
        _engine = create_async_engine(DATABASE_URL, echo=False)
    return _engine


def _get_session_factory():
    global _async_session
    if _async_session is None:
        _async_session = async_sessionmaker(
            _get_engine(), class_=AsyncSession, expire_on_commit=False
        )
    return _async_session


class Base(DeclarativeBase):
    pass


async def get_db():
    factory = _get_session_factory()
    async with factory() as session:
        yield session


async def create_tables():
    import models  # noqa: ensure all model classes are loaded onto Base.metadata
    engine = _get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
