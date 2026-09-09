from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth_router,
    devices_router,
    sensor_data_router,
    alerts_router,
    device_sessions_router,
)

# Schema is now owned by Alembic (see alembic/ and README) -- run
# `alembic upgrade head` to create/update tables. The old create_all()
# dev-convenience hook was removed so the app and the migration history
# can't silently drift apart.
app = FastAPI(title="DSS Wearable App API", version="0.1.0")

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
app.include_router(device_sessions_router.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
