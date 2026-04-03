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

    # Auto-add missing columns (safe for existing deployments)
    await _ensure_columns(engine)


async def _ensure_columns(engine):
    """Add columns that may be missing from earlier schema versions."""
    from sqlalchemy import text
    async with engine.begin() as conn:
        # account_type on users (added in migration 004)
        try:
            await conn.execute(text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'buyer'"
            ))
        except Exception:
            pass

        # Split payment fields on orders (Phase 3)
        for col in [
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2)",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(10,2)",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_paid_at TIMESTAMPTZ",
        ]:
            try:
                await conn.execute(text(col))
            except Exception:
                pass

        # Preorder fields on products (Phase 4)
        for col in [
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT false",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS preorder_deadline TIMESTAMPTZ",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS estimated_ship_date TIMESTAMPTZ",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS shipment_window_id VARCHAR(36)",
        ]:
            try:
                await conn.execute(text(col))
            except Exception:
                pass
