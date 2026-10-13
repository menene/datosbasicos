"""Ríos endpoints.

Los ríos principales y sus cuencas son datos de referencia estáticos, extraídos a
mano de los estudios hidrosociales de /docs/agua (vertientes del Pacífico, del
Caribe y del Golfo de México). Igual que los lagos, se sirven directamente desde
seed/data/rios.json en lugar de la base de datos.

Un río atraviesa varios departamentos, así que el filtro `departamento` devuelve
los ríos cuya cuenca toca ese departamento.
"""
import json
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/rios", tags=["rios"])

DATA_PATH = Path(__file__).parent.parent / "seed" / "data" / "rios.json"


@lru_cache(maxsize=2)
def _leer(mtime: float) -> list[dict]:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def _load() -> list[dict]:
    """Cachea el JSON con la fecha del archivo como parte de la llave, para que
    un despliegue que solo actualice `rios.json` surta efecto sin reiniciar."""
    if not DATA_PATH.exists():
        return []
    return _leer(DATA_PATH.stat().st_mtime)


@router.get("")
async def list_rios(departamento: str | None = Query(None)):
    data = _load()
    if departamento:
        data = [rio for rio in data if departamento in rio["departamentos"]]
    return data


@router.get("/{slug}")
async def get_rio(slug: str):
    for rio in _load():
        if rio["slug"] == slug:
            return rio
    raise HTTPException(status_code=404, detail="Río no encontrado")
