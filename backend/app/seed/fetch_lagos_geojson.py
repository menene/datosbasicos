"""Descarga los polígonos de los lagos desde OpenStreetMap y los agrega al GeoJSON municipal.

geoBoundaries GTM ADM2 solo recorta dos lagos (Amatitlán y Atitlán); Petén Itzá e
Izabal quedaron dentro de los polígonos de sus municipios. Este script baja esas
formas de OSM —donde cada lago es una relación `natural=water` / `type=multipolygon`—
y las agrega a `guatemala_municipios.geojson` con la misma estructura de propiedades
que trae geoBoundaries.

Es idempotente: un lago que ya está en el archivo se salta. Los polígonos se
simplifican al nivel de detalle del resto del archivo (los municipios tienen entre 9
y 468 puntos), porque el mapa dibuja el país entero en un SVG de 800x700 y el detalle
de OSM (más de 3,500 puntos por lago) no se vería y sí pesaría.

Los datos de OSM son ODbL: la atribución vive en la propiedad `fuente` de cada
polígono y en el campo `fuentes` de `lagos.json`.

Uso:
    python backend/app/seed/fetch_lagos_geojson.py            # agrega los faltantes
    python backend/app/seed/fetch_lagos_geojson.py --dry-run  # solo informa

Para sumar otro cuerpo de agua: buscarlo en https://www.openstreetmap.org, copiar el
id de su relación y agregar una entrada a LAGOS. Después, poner su `geo_slug` en
`lagos.json` (el slug del `shapeName`: "Lago De X" → "lago-de-x") para que el mapa lo
enlace con su ficha.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import urllib.request
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
GEOJSON = DATA_DIR / "guatemala_municipios.geojson"

# Espejos de Overpass: el principal devuelve 504 con frecuencia, así que se reintenta.
ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

# relación OSM → cómo debe quedar el polígono en el archivo.
# `puntos` es el objetivo de nodos del contorno tras simplificar.
LAGOS = [
    {"osm": 1580606, "shapeName": "Lago De Izabal", "departamento": "Izabal", "puntos": 220},
    {"osm": 1919447, "shapeName": "Lago De Peten Itza", "departamento": "Petén", "puntos": 200},
    # Ya vienen en geoBoundaries; quedan documentados por si hay que rehacerlos:
    # {"osm": 5781818, "shapeName": "Lago De Atitlan", "departamento": "Sololá", "puntos": 130},
    # {"osm": 11018382, "shapeName": "Lago De Amatitlan", "departamento": "Guatemala", "puntos": 60},
]

# Una isla más chica que esto desaparece a escala nacional: no vale el peso.
AREA_MINIMA_ISLA_KM2 = 0.5


def overpass(relacion: int) -> dict:
    """Pide la geometría de una relación, probando los espejos en orden."""
    consulta = f"[out:json][timeout:180];relation({relacion});out geom;"
    errores = []
    for url in ENDPOINTS:
        try:
            req = urllib.request.Request(
                url,
                data=consulta.encode("utf-8"),
                headers={"User-Agent": "guatemala-datos-basicos/1.0 (seed script)"},
            )
            with urllib.request.urlopen(req, timeout=180) as resp:
                datos = json.loads(resp.read().decode("utf-8"))
            if datos.get("elements"):
                return datos["elements"][0]
            errores.append(f"{url}: respuesta vacía")
        except Exception as exc:  # noqa: BLE001 — cualquier fallo pasa al siguiente espejo
            errores.append(f"{url}: {exc}")
    raise RuntimeError(f"no se pudo bajar la relación {relacion}\n  " + "\n  ".join(errores))


def anillos(relacion: dict) -> dict[str, list[list[tuple[float, float]]]]:
    """Une los `way` de una relación multipolygon en anillos cerrados, por rol."""
    salida: dict[str, list[list[tuple[float, float]]]] = {"outer": [], "inner": []}
    for rol in ("outer", "inner"):
        segmentos = [
            [(p["lon"], p["lat"]) for p in m["geometry"]]
            for m in relacion["members"]
            if m["type"] == "way" and m.get("role", "outer") == rol and m.get("geometry")
        ]
        while segmentos:
            anillo = segmentos.pop(0)
            avance = True
            while anillo[0] != anillo[-1] and avance:
                avance = False
                for i, s in enumerate(segmentos):
                    if s[0] == anillo[-1]:
                        anillo += s[1:]
                    elif s[-1] == anillo[-1]:
                        anillo += s[::-1][1:]
                    elif s[-1] == anillo[0]:
                        anillo = s[:-1] + anillo
                    elif s[0] == anillo[0]:
                        anillo = s[::-1][:-1] + anillo
                    else:
                        continue
                    segmentos.pop(i)
                    avance = True
                    break
            if anillo[0] != anillo[-1]:
                anillo.append(anillo[0])
            salida[rol].append(anillo)
    return salida


def _dp(pts: list, tol: float) -> list:
    """Douglas–Peucker sobre una polilínea abierta."""
    if len(pts) < 3:
        return pts[:]
    conservar = [False] * len(pts)
    conservar[0] = conservar[-1] = True
    pila = [(0, len(pts) - 1)]
    while pila:
        a, b = pila.pop()
        if b <= a + 1:
            continue
        x1, y1 = pts[a]
        x2, y2 = pts[b]
        dx, dy = x2 - x1, y2 - y1
        norma = math.hypot(dx, dy)
        peor, idx = -1.0, -1
        for i in range(a + 1, b):
            x0, y0 = pts[i]
            d = (
                abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / norma
                if norma
                else math.hypot(x0 - x1, y0 - y1)
            )
            if d > peor:
                peor, idx = d, i
        if peor > tol:
            conservar[idx] = True
            pila += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, conservar) if k]


def simplificar(anillo: list, objetivo: int) -> list:
    """Baja el anillo al número de puntos pedido, buscando la tolerancia por bisección.

    Un anillo cerrado se parte primero en el punto más lejano al inicial: si no, el
    primer segmento de Douglas–Peucker va de un punto a sí mismo y se lleva el anillo
    entero por delante.
    """
    pts = anillo[:-1] if anillo[0] == anillo[-1] else anillo[:]
    if len(pts) < 4:
        return anillo[:]
    p0 = pts[0]
    lejano = max(
        range(1, len(pts)),
        key=lambda i: (pts[i][0] - p0[0]) ** 2 + (pts[i][1] - p0[1]) ** 2,
    )

    def corte(tol: float) -> list:
        out = _dp(pts[: lejano + 1], tol) + _dp(pts[lejano:] + [p0], tol)[1:]
        if out[0] != out[-1]:
            out.append(out[0])
        return out

    lo, hi = 1e-7, 0.05
    for _ in range(50):
        mid = (lo + hi) / 2
        if len(corte(mid)) > objetivo:
            lo = mid
        else:
            hi = mid
    return corte(hi)


def area_km2(anillo: list) -> float:
    """Área aproximada del anillo (equirectangular local); sirve para control, no para publicar."""
    lat0 = sum(p[1] for p in anillo) / len(anillo)
    k = math.cos(math.radians(lat0))
    s = 0.0
    for (x1, y1), (x2, y2) in zip(anillo, anillo[1:]):
        s += (x1 * k) * y2 - (x2 * k) * y1
    return abs(s) / 2 * (111.32**2)


def construir_feature(cfg: dict) -> tuple[dict, str]:
    relacion = overpass(cfg["osm"])
    partes = anillos(relacion)
    exterior = [simplificar(r, cfg["puntos"]) for r in partes["outer"]]
    islas = [
        simplificar(r, 40) for r in partes["inner"] if area_km2(r) > AREA_MINIMA_ISLA_KM2
    ]
    antes = sum(area_km2(r) for r in partes["outer"]) - sum(
        area_km2(r) for r in partes["inner"]
    )
    despues = sum(area_km2(r) for r in exterior) - sum(area_km2(r) for r in islas)
    feature = {
        "type": "Feature",
        "properties": {
            "shapeName": cfg["shapeName"],
            "shapeISO": "",
            "shapeID": f"OSM-R{cfg['osm']}",
            "shapeGroup": "GTM",
            "shapeType": "ADM2",
            "departamento": cfg["departamento"],
            "fuente": f"OpenStreetMap, relación {cfg['osm']} (ODbL)",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [[round(x, 7), round(y, 7)] for x, y in r] for r in (exterior + islas)
            ],
        },
    }
    informe = (
        f"  contorno {len(partes['outer'][0])} → {len(exterior[0])} puntos · "
        f"islas {len(partes['inner'])} → {len(islas)} · "
        f"área {antes:,.1f} → {despues:,.1f} km² ({(despues / antes - 1) * 100:+.2f} %)"
    )
    return feature, informe


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true", help="no escribe el archivo")
    args = ap.parse_args()

    if not GEOJSON.exists():
        print(f"No existe {GEOJSON}", file=sys.stderr)
        return 1

    gj = json.loads(GEOJSON.read_text(encoding="utf-8"))
    existentes = {f["properties"]["shapeName"] for f in gj["features"]}
    agregados = 0

    for cfg in LAGOS:
        if cfg["shapeName"] in existentes:
            print(f"= {cfg['shapeName']}: ya está en el archivo")
            continue
        print(f"↓ {cfg['shapeName']}: bajando la relación {cfg['osm']}…")
        feature, informe = construir_feature(cfg)
        print(informe)
        # Al final del arreglo a propósito: el mapa dibuja en orden, y así el agua
        # queda encima de los municipios que sí incluyen el área del lago.
        gj["features"].append(feature)
        agregados += 1

    lagos = sum(1 for f in gj["features"] if f["properties"]["shapeName"].startswith("Lago"))
    print(f"\n{len(gj['features'])} features: {len(gj['features']) - lagos} municipios + {lagos} lagos")

    if args.dry_run:
        print("--dry-run: no se escribió nada")
    elif agregados:
        GEOJSON.write_text(
            json.dumps(gj, ensure_ascii=False, separators=(", ", ": ")), encoding="utf-8"
        )
        print(f"Escrito {GEOJSON} (+{agregados})")
        print("Recordá poner el `geo_slug` de cada lago nuevo en data/lagos.json.")
    else:
        print("Nada que agregar")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
