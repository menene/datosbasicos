"""Descarga el trazo de los ríos de rios.json desde OpenStreetMap → rios.geojson.

Cada río de `rios.json` (los de los estudios hidrosociales de docs/agua) se busca en
OSM por id: casi todos son una relación `waterway=river`; Salinas y Río Dulce solo
existen como vías (`way`) sueltas. El Xaclbal no está trazado en OSM y queda sin
línea en el mapa.

El trazo se procesa así:
  1. se unen los tramos de cada río en líneas continuas;
  2. se simplifica (Douglas-Peucker) al detalle del mapa, que dibuja el país entero
     en un SVG de ~800 px: OSM trae decenas de miles de puntos que no se verían;
  3. se recorta a Guatemala con un margen de ~1.5 km, para que los ríos que son
     frontera (Usumacinta, Sarstún) no desaparezcan al caer un punto del lado de
     México o Belice, pero sí se corten los tramos que corren dentro de esos países.

Los datos de OSM son ODbL: la atribución vive en la propiedad `fuente`.

Uso (desde la raíz del repo):
    python backend/app/seed/fetch_rios_geojson.py
"""
from __future__ import annotations

import json
import math
import urllib.request
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
SALIDA = DATA_DIR / "rios.geojson"
PAIS = DATA_DIR / "guatemala.geojson"

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

# slug de rios.json → elementos de OSM. Donde hay dos ríos con el mismo nombre, el id
# se eligió por ubicación (el Naranjo del Pacífico, el San Pedro de Petén).
RIOS: dict[str, dict[str, list[int]]] = {
    "samala": {"rel": [4583355]},
    "ocosito": {"rel": [4583354]},
    "naranjo": {"rel": [4583457]},
    "madre-vieja": {"rel": [4581577]},
    "coyolate": {"rel": [4576872]},
    "achiguate": {"rel": [4469306]},
    "maria-linda": {"rel": [15693448]},
    "los-esclavos": {"rel": [12545186]},
    "motagua": {"rel": [4595641]},
    "polochic": {"rel": [5974605]},
    "cahabon": {"rel": [5974604]},
    "sarstun": {"rel": [9485852]},
    "rio-dulce": {"way": [936891951]},
    "usumacinta": {"rel": [4669659]},
    "la-pasion": {"rel": [4669751]},
    "salinas": {"way": [414903912, 1305517953, 1305517954]},
    "san-pedro": {"rel": [6231408]},
    "candelaria": {"rel": [12146214]},
    "chixoy": {"rel": [4669748]},
    "ixcan": {"rel": [4667913]},
    # "xaclbal": no está trazado en OpenStreetMap.
}

TOLERANCIA = 0.0025      # grados (~270 m) para simplificar
MARGEN_FRONTERA = 0.015  # grados (~1.6 km) de tolerancia al recortar


def overpass(consulta: str) -> dict:
    errores = []
    for url in ENDPOINTS:
        try:
            req = urllib.request.Request(
                url, data=("data=" + urllib.request.quote(consulta)).encode(),
                headers={"User-Agent": "guatemala-datos-basicos/1.0 (seed script)"},
            )
            with urllib.request.urlopen(req, timeout=240) as resp:
                datos = json.loads(resp.read().decode("utf-8"))
            if datos.get("elements"):
                return datos
            errores.append(f"{url}: respuesta vacía")
        except Exception as exc:  # noqa: BLE001 — cualquier fallo pasa al siguiente espejo
            errores.append(f"{url}: {exc}")
    raise RuntimeError("Overpass no respondió:\n  " + "\n  ".join(errores))


def tramos(elementos: list[dict]) -> list[list[tuple[float, float]]]:
    """Las vías de un río como listas de (lon, lat)."""
    out = []
    for e in elementos:
        vias = [m for m in e.get("members", []) if m["type"] == "way"] if e["type"] == "relation" else [e]
        for v in vias:
            g = v.get("geometry") or []
            if len(g) >= 2:
                out.append([(p["lon"], p["lat"]) for p in g])
    return out


def unir(lineas: list[list[tuple[float, float]]]) -> list[list[tuple[float, float]]]:
    """Encadena tramos que comparten extremo, invirtiéndolos si hace falta."""
    lineas = [list(l) for l in lineas]
    unidas = []
    while lineas:
        actual = lineas.pop(0)
        cambio = True
        while cambio:
            cambio = False
            for i, l in enumerate(lineas):
                if l[0] == actual[-1]:
                    actual += l[1:]
                elif l[-1] == actual[-1]:
                    actual += l[::-1][1:]
                elif l[-1] == actual[0]:
                    actual = l[:-1] + actual
                elif l[0] == actual[0]:
                    actual = l[::-1][:-1] + actual
                else:
                    continue
                lineas.pop(i)
                cambio = True
                break
        unidas.append(actual)
    return unidas


def simplificar(pts: list[tuple[float, float]], tol: float) -> list[tuple[float, float]]:
    """Douglas-Peucker iterativo."""
    if len(pts) < 3:
        return pts
    conservar = [False] * len(pts)
    conservar[0] = conservar[-1] = True
    pila = [(0, len(pts) - 1)]
    while pila:
        a, b = pila.pop()
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        largo = math.hypot(dx, dy) or 1e-12
        idx, dmax = -1, 0.0
        for i in range(a + 1, b):
            x, y = pts[i]
            d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / largo
            if d > dmax:
                idx, dmax = i, d
        if dmax > tol:
            conservar[idx] = True
            pila += [(a, idx), (idx, b)]
    return [p for p, c in zip(pts, conservar) if c]


class Pais:
    """Prueba punto-en-Guatemala, con margen junto a la frontera."""

    def __init__(self, geojson: Path):
        self.anillos = []
        for f in json.loads(geojson.read_text(encoding="utf-8"))["features"]:
            geom = f["geometry"]
            polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
            for poly in polys:
                anillo = [tuple(p) for p in poly[0]]
                xs, ys = zip(*anillo)
                self.anillos.append((anillo, (min(xs), min(ys), max(xs), max(ys))))
        # Rejilla de los vértices de los contornos, para medir la distancia a la frontera.
        self.rejilla: dict[tuple[int, int], list[tuple[float, float]]] = {}
        for anillo, _ in self.anillos:
            for x, y in anillo:
                self.rejilla.setdefault((int(x / 0.05), int(y / 0.05)), []).append((x, y))

    def _dentro(self, x: float, y: float) -> bool:
        for anillo, (x0, y0, x1, y1) in self.anillos:
            if not (x0 <= x <= x1 and y0 <= y <= y1):
                continue
            dentro = False
            for (ax, ay), (bx, by) in zip(anillo, anillo[1:]):
                if (ay > y) != (by > y) and x < (bx - ax) * (y - ay) / (by - ay) + ax:
                    dentro = not dentro
            if dentro:
                return True
        return False

    def _cerca_de_frontera(self, x: float, y: float) -> bool:
        cx, cy = int(x / 0.05), int(y / 0.05)
        for i in (-1, 0, 1):
            for j in (-1, 0, 1):
                for vx, vy in self.rejilla.get((cx + i, cy + j), ()):
                    if math.hypot(vx - x, vy - y) <= MARGEN_FRONTERA:
                        return True
        return False

    def contiene(self, x: float, y: float) -> bool:
        return self._dentro(x, y) or self._cerca_de_frontera(x, y)


def recortar(linea, pais: Pais) -> list[list[tuple[float, float]]]:
    partes, actual = [], []
    for p in linea:
        if pais.contiene(*p):
            actual.append(p)
        else:
            if len(actual) >= 2:
                partes.append(actual)
            actual = []
    if len(actual) >= 2:
        partes.append(actual)
    return partes


def main() -> None:
    nombres = {r["slug"]: r["nombre"] for r in json.loads((DATA_DIR / "rios.json").read_text(encoding="utf-8"))}
    rels = sorted({i for r in RIOS.values() for i in r.get("rel", [])})
    ways = sorted({i for r in RIOS.values() for i in r.get("way", [])})
    consulta = (
        "[out:json][timeout:180];("
        + f"rel(id:{','.join(map(str, rels))});"
        + f"way(id:{','.join(map(str, ways))});"
        + ");out geom;"
    )
    print("Descargando de Overpass…")
    elementos = {(e["type"], e["id"]): e for e in overpass(consulta)["elements"]}
    pais = Pais(PAIS)

    features = []
    for slug, ids in RIOS.items():
        sel = [elementos[("relation", i)] for i in ids.get("rel", []) if ("relation", i) in elementos]
        sel += [elementos[("way", i)] for i in ids.get("way", []) if ("way", i) in elementos]
        lineas = []
        for l in unir(tramos(sel)):
            for parte in recortar(simplificar(l, TOLERANCIA), pais):
                lineas.append([[round(x, 5), round(y, 5)] for x, y in parte])
        if not lineas:
            print(f"  ! {slug}: sin trazo dentro de Guatemala")
            continue
        features.append({
            "type": "Feature",
            "properties": {
                "slug": slug,
                "nombre": nombres.get(slug, slug),
                "fuente": "© OpenStreetMap contributors (ODbL)",
            },
            "geometry": {"type": "MultiLineString", "coordinates": lineas},
        })
        print(f"  {slug:14} {len(lineas):3} tramos  {sum(len(l) for l in lineas):5} puntos")

    SALIDA.write_text(
        json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Escrito {SALIDA.name}: {len(features)} ríos, {SALIDA.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
