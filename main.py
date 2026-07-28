from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth_router, devices_router, sensor_data_router, alerts_router

# Dev convenience only — use Alembic migrations once the schema stabilizes.
Base.metadata.create_all(bind=engine)

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


@app.get("/health")
def health_check():
    return {"status": "ok"}
