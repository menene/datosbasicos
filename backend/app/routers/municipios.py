"""Municipios endpoints.

Municipio data is static, single-snapshot reference data (272 of Guatemala's 340
municipios, extracted from the source docs in /docs — see seed/extract_municipios.py).
It has no year dimension and no relational queries, so it is served straight from
seed/data/municipios.json rather than the database.
"""
import json
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/municipios", tags=["municipios"])

DATA_PATH = Path(__file__).parent.parent / "seed" / "data" / "municipios.json"


@lru_cache(maxsize=1)
def _load() -> list[dict]:
    if not DATA_PATH.exists():
        return []
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


@router.get("")
async def list_municipios(departamento: str | None = Query(None)):
    data = _load()
    if departamento:
        data = [m for m in data if m["departamento_slug"] == departamento]
    return data


@router.get("/{slug}")
async def get_municipio(slug: str):
    for m in _load():
        if m["slug"] == slug:
            return m
    raise HTTPException(status_code=404, detail="Municipio no encontrado")
