import json
from functools import lru_cache
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


@lru_cache(maxsize=2)
def _lagos(mtime: float) -> dict:
    """Solo los polígonos de lago del archivo municipal.

    El mapa departamental los necesita dibujados aparte: geoBoundaries dejó hueco en
    el polígono de tres departamentos (Sololá, Guatemala e Izabal), pero en Petén el
    lago queda cubierto por tierra sólida, así que sin esta capa Petén Itzá no se ve.
    Se filtra en vez de guardar otro archivo, para que no haya dos copias que
    mantener sincronizadas — y pesa ~15 KB en lugar de 1.1 MB.
    """
    datos = json.loads(GEOJSON_MUNICIPIOS_PATH.read_text(encoding="utf-8"))
    features = [
        f
        for f in datos.get("features", [])
        if str(f.get("properties", {}).get("shapeName", "")).lower().startswith("lago")
    ]
    return {"type": "FeatureCollection", "features": features}


@router.get("/lagos")
async def get_geo_lagos():
    if not GEOJSON_MUNICIPIOS_PATH.exists():
        return JSONResponse(
            status_code=404,
            content={
                "detail": "GeoJSON no disponible. Coloca el archivo en "
                "backend/app/seed/data/guatemala_municipios.geojson"
            },
        )
    return JSONResponse(content=_lagos(GEOJSON_MUNICIPIOS_PATH.stat().st_mtime))
