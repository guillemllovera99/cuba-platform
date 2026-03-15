"""
Cuba E-Commerce MVP — Application Factory
Routes are defined in the routers/ package.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from database import create_tables
from seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await create_tables()
        await seed()
        print("Database initialized and seeded successfully.")
    except Exception as e:
        # Log but do NOT crash — let the server start so health checks pass.
        # DB-dependent endpoints will fail individually until the DB is reachable.
        print(f"WARNING: Database init failed (will retry on first request): {e}")
    yield


app = FastAPI(title="Cuba E-Commerce MVP", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ────────────────────────────────────────
# Import order matters: admin_orders must come before orders so that
# /api/v1/orders/admin/... paths are matched before /api/v1/orders/{order_id}
from routers.health import router as health_router
from routers.auth import router as auth_router
from routers.catalog import router as catalog_router
from routers.admin_orders import router as admin_orders_router
from routers.orders import router as orders_router
from routers.admin_stats import router as admin_stats_router

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(catalog_router)
app.include_router(admin_orders_router)
app.include_router(orders_router)
app.include_router(admin_stats_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
