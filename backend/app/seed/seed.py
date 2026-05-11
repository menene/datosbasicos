"""
Script de carga inicial de datos.
Uso: docker compose exec backend python -m app.seed.seed
"""
import asyncio
import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, engine, Base
from app.models.region import Region
from app.models.departamento import Departamento
from app.models.indicador import Indicador

DATA_PATH = Path(__file__).parent / "data" / "departamentos.json"


async def seed(db: AsyncSession) -> None:
    if not DATA_PATH.exists():
        print(f"Archivo de datos no encontrado: {DATA_PATH}")
        return

    with open(DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)

    # Crear regiones únicas
    regiones_nombres: set[str] = {d["region"] for d in data if d.get("region")}
    regiones: dict[str, Region] = {}

    for nombre in sorted(regiones_nombres):
        result = await db.execute(select(Region).where(Region.nombre == nombre))
        region = result.scalar_one_or_none()
        if not region:
            region = Region(nombre=nombre)
            db.add(region)
            await db.flush()
            print(f"  Region creada: {nombre}")
        regiones[nombre] = region

    # Crear departamentos e indicadores
    for entry in data:
        result = await db.execute(select(Departamento).where(Departamento.slug == entry["slug"]))
        depto = result.scalar_one_or_none()

        if not depto:
            region_obj = regiones.get(entry.get("region", ""))
            depto = Departamento(
                slug=entry["slug"],
                nombre=entry["nombre"],
                region_id=region_obj.id if region_obj else None,
                superficie_km2=entry.get("superficie_km2"),
                descripcion=entry.get("descripcion"),
            )
            db.add(depto)
            await db.flush()
            print(f"  Departamento creado: {entry['nombre']}")

        # Indicadores
        ind_data = entry.get("indicadores", {})
        anio = ind_data.get("anio", 2025)
        result = await db.execute(
            select(Indicador).where(
                Indicador.departamento_id == depto.id,
                Indicador.anio == anio,
            )
        )
        indicador = result.scalar_one_or_none()

        if not indicador:
            indicador = Indicador(departamento_id=depto.id, anio=anio)
            db.add(indicador)

        for campo, valor in ind_data.items():
            if campo != "anio" and hasattr(indicador, campo):
                setattr(indicador, campo, valor)

    await db.commit()
    print("Seed completado.")


async def main() -> None:
    print("Iniciando seed...")
    async with AsyncSessionLocal() as db:
        await seed(db)


if __name__ == "__main__":
    asyncio.run(main())
