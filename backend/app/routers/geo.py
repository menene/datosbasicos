import json
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/geo", tags=["geo"])

DATA_DIR = Path(__file__).parent.parent / "seed" / "data"
GEOJSON_PATH = DATA_DIR / "guatemala.geojson"
GEOJSON_MUNICIPIOS_PATH = DATA_DIR / "guatemala_municipios.geojson"


def _serve_geojson(path: Path, hint: str) -> JSONResponse:
    if not path.exists():
        return JSONResponse(
            status_code=404,
            content={"detail": f"GeoJSON no disponible. Coloca el archivo en {hint}"},
        )
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return JSONResponse(content=data)


@router.get("/departamentos")
async def get_geo_departamentos():
    return _serve_geojson(
        GEOJSON_PATH, "backend/app/seed/data/guatemala.geojson"
    )


@router.get("/municipios")
async def get_geo_municipios():
    return _serve_geojson(
        GEOJSON_MUNICIPIOS_PATH, "backend/app/seed/data/guatemala_municipios.geojson"
    )
