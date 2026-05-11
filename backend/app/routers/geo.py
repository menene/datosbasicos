import json
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/geo", tags=["geo"])

GEOJSON_PATH = Path(__file__).parent.parent / "seed" / "data" / "guatemala.geojson"


@router.get("/departamentos")
async def get_geo_departamentos():
    if not GEOJSON_PATH.exists():
        return JSONResponse(
            status_code=404,
            content={"detail": "GeoJSON no disponible. Coloca el archivo en backend/app/seed/data/guatemala.geojson"},
        )
    with open(GEOJSON_PATH, encoding="utf-8") as f:
        data = json.load(f)
    return JSONResponse(content=data)
