from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import departamentos, indicadores, geo

app = FastAPI(
    title="Guatemala Datos Básicos API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(departamentos.router, prefix="/api/v1")
app.include_router(indicadores.router, prefix="/api/v1")
app.include_router(geo.router, prefix="/api/v1")


@app.get("/api/v1/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok"}
