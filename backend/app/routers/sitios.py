"""Sitios de interés.

Índice de los lugares que vale la pena tener ficha propia: lagos, sitios
arqueológicos, parques naturales. La ficha del departamento solo muestra la lista
—no el informe completo— para no robarle el foco a los indicadores.

Cada sitio dice dónde vive su detalle:

- `detalle: "lago"` → la ficha larga está en /api/v1/lagos/{detalle_slug}.
- `detalle: null`   → el sitio se describe con sus propias `secciones`, aquí mismo.

Datos estáticos, sin base de datos, igual que municipios y lagos.
"""
import json
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/sitios", tags=["sitios"])

DATA_PATH = Path(__file__).parent.parent / "seed" / "data" / "sitios.json"


@lru_cache(maxsize=2)
def _leer(mtime: float) -> list[dict]:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def _load() -> list[dict]:
    """Cachea el JSON con la fecha del archivo en la llave, para que actualizar
    `sitios.json` surta efecto sin reiniciar el backend."""
    if not DATA_PATH.exists():
        return []
    return _leer(DATA_PATH.stat().st_mtime)


@router.get("")
async def list_sitios(departamento: str | None = Query(None)):
    data = _load()
    if departamento:
        data = [s for s in data if s["departamento_slug"] == departamento]
    return data


@router.get("/{slug}")
async def get_sitio(slug: str):
    for sitio in _load():
        if sitio["slug"] == slug:
            return sitio
    raise HTTPException(status_code=404, detail="Sitio no encontrado")
