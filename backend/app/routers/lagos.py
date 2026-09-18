"""Lagos endpoints.

Los cuatro lagos principales del país son datos de referencia estáticos: una ficha
por lago, sin dimensión temporal ni consultas relacionales. Igual que los municipios,
se sirven directamente desde seed/data/lagos.json en lugar de la base de datos.
"""
import json
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/lagos", tags=["lagos"])

DATA_PATH = Path(__file__).parent.parent / "seed" / "data" / "lagos.json"


@lru_cache(maxsize=2)
def _leer(mtime: float) -> list[dict]:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def _load() -> list[dict]:
    """Cachea el JSON con la fecha del archivo como parte de la llave, para que
    un despliegue que solo actualice `lagos.json` surta efecto sin reiniciar."""
    if not DATA_PATH.exists():
        return []
    return _leer(DATA_PATH.stat().st_mtime)


@router.get("")
async def list_lagos(departamento: str | None = Query(None)):
    data = _load()
    if departamento:
        data = [lago for lago in data if lago["departamento_slug"] == departamento]
    return data


@router.get("/{slug}")
async def get_lago(slug: str):
    for lago in _load():
        if lago["slug"] == slug:
            return lago
    raise HTTPException(status_code=404, detail="Lago no encontrado")
