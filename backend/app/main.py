from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth_router, devices_router, sensor_data_router, alerts_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Dev convenience only — use Alembic migrations once the schema stabilizes.

    The pytest suite overrides the `get_db` dependency with its own
    in-memory SQLite session and creates its own tables in conftest.py, so
    this hook runs against the real (Postgres) engine independently and
    should never crash the app/test run if no Postgres is reachable.
    """
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:  # noqa: BLE001 - startup convenience only, never fatal
        print(f"[startup] skipped auto-create_all: {exc}")
    yield


app = FastAPI(title="DSS Wearable App API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before any real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(devices_router.router)
app.include_router(sensor_data_router.router)
app.include_router(alerts_router.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
