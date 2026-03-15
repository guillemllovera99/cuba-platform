"""
Alembic environment configuration.

Imports DATABASE_URL_SYNC from the existing config.py so the DB connection
string is resolved the same way for both the app and migrations.
"""
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ── Import our app's config and models ──────────────────────────────────
# This makes Alembic aware of all existing tables via Base.metadata.
from config import DATABASE_URL_SYNC
import models  # noqa: F401  — ensures all model classes register on Base.metadata
from database import Base

# ── Alembic Config object ──────────────────────────────────────────────
config = context.config

# Override sqlalchemy.url with the value from our config.py
# (alembic.ini intentionally leaves it blank)
if DATABASE_URL_SYNC:
    config.set_main_option("sqlalchemy.url", DATABASE_URL_SYNC)

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Tell Alembic what metadata to compare against
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — generates SQL without a live DB."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode — connects to the DB directly."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
