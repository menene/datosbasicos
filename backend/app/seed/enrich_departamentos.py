"""Fill departamento indicator gaps from the newer thematic .docx tables in /docs.

The base departamento records (seed/data/departamentos.json) were built from the
consolidated 1994 / 2005 / 2025 profiles, which carry population and social data but
leave the health, economic-activity and duplication columns empty for 2005 and 2025.
Several single-topic documents published later cover exactly those gaps, one table
per indicator with a row per departamento:

  · POBLACIÓN ECONÓMICAMENTE ACTIVA E INACTIVA 2005 Y 2025  → ocupados, desocupados,
    ingreso medio anual (PEA = ocupados + desocupados)
  · TASA DE MORTALIDAD MATERNA POR CADA 1,000 NACIDOS VIVOS, 2005 Y 2025
  · TASA DE DUPLICACIÓN DE LA POBLACIÓN … AÑO 2005 → tasa anual + tiempo de duplicación
  · TASA GLOBAL DE FECUNDIDAD Y MATRIMONIOS → nupcialidad 2021-2025 + TGF 2022
  · IDH Guatemala 1994 → índice y ranking departamental de 1994
  · GUATEMALA DATOS BASICOS 1994 → el corte completo de 1994, un bloque de prosa por
    departamento (extensión, población, mortalidad general y materna, PEA, ingreso…)

Al final recalcula los dos indicadores derivados (densidad y tiempo de duplicación)
con `derivados.completar`, para cada corte anual.

This script rewrites seed/data/departamentos.json in place. It is idempotent: values
are recomputed from the documents on every run. Only the keys listed per source are
touched; everything else in the file is preserved.

Run from the repo root:
    python backend/app/seed/enrich_departamentos.py
"""
from __future__ import annotations

import json
import re
import unicodedata
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

try:  # runs both as `python backend/app/seed/enrich_departamentos.py` and as a module
    from app.seed.derivados import completar
except ImportError:  # pragma: no cover - depends on how the script is invoked
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from derivados import completar

ROOT = Path(__file__).resolve().parents[3]
DOCS_DIR = ROOT / "docs"
DATA = Path(__file__).resolve().parent / "data" / "departamentos.json"

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def slugify(name: str) -> str:
    n = unicodedata.normalize("NFD", name).encode("ascii", "ignore").decode()
    n = n.lower().strip()
    n = re.sub(r"[\s_]+", "-", n)
    n = re.sub(r"[^a-z0-9-]", "", n)
    return re.sub(r"-+", "-", n).strip("-")


def docx_tables(path: Path) -> list[list[list[str]]]:
    """Every table in the document as a list of rows of cell strings."""
    root = ET.fromstring(zipfile.ZipFile(path).read("word/document.xml"))
    tables = []
    for tbl in root.iter(f"{W}tbl"):
        rows = []
        for tr in tbl.findall(f"{W}tr"):
            cells = []
            for tc in tr.findall(f"{W}tc"):
                text = "".join(t.text or "" for t in tc.iter(f"{W}t"))
                cells.append(re.sub(r"\s+", " ", text).strip())
            rows.append(cells)
        tables.append(rows)
    return tables


def docx_lines(path: Path) -> list[str]:
    """Every paragraph in the document, as plain text."""
    root = ET.fromstring(zipfile.ZipFile(path).read("word/document.xml"))
    lineas = []
    for par in root.iter(f"{W}p"):
        texto = "".join(t.text or "" for t in par.iter(f"{W}t"))
        texto = re.sub(r"\s+", " ", texto).strip()
        if texto:
            lineas.append(texto)
    return lineas


def num(cell: str) -> float | None:
    """Parse a number written Guatemalan-style (1.234,5 / 1,234.5 / ~12.3)."""
    tok = re.search(r"-?\d[\d.,]*", cell.replace(" ", ""))
    if not tok:
        return None
    s = tok.group(0).strip(".,")
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".") if s.rfind(",") > s.rfind(".") else s.replace(",", "")
    else:
        for sep in (",", "."):
            if s.count(sep) > 1:
                s = s.replace(sep, "")
            elif sep in s:
                head, tail = s.split(sep)
                # 3 trailing digits are a thousands group ("1.234"), unless the number
                # starts at zero — "0.769" is a decimal, never 769.
                thousands = len(tail) == 3 and head.lstrip("-") not in ("", "0")
                s = s.replace(sep, "") if thousands else s.replace(sep, ".")
    try:
        return float(s)
    except ValueError:
        return None


# Department name as written in the tables ("7. Guatemala", "El Petén", "Quiché") → slug.
ALIAS = {"el-peten": "peten", "peten": "peten", "el-progreso": "el-progreso"}


def dept_slug(cell: str, valid: set[str]) -> str | None:
    name = re.sub(r"^\s*\d+[.)]\s*", "", cell)            # drop the "12." index
    name = re.sub(r"\((.*?)\)", " ", name)                 # drop "(Dpto)" / "(cabecera)"
    name = re.sub(r"^(departamento|depto\.?)\s+(de\s+)?", "", name, flags=re.I)
    s = ALIAS.get(slugify(name), slugify(name))
    return s if s in valid else None


def load_docs() -> dict[str, Path]:
    """Map a short key to the source document, matched by a distinctive fragment."""
    wanted = {
        "pea": "POBLACION ECONOMICAMENTE ACTIVA E INACTIVA 2005",
        "materna": "TASA DE MORTALIDAD MATERNA",
        "duplicacion": "TASA DE DUPLICACION DE LA POBLACION",
        "fecundidad": "TASA GLOBAL DE FECUNDIDAD",
        "idh1994": "IDH GUATEMALA 1994",
        "libro1994": "GUATEMALA DATOS BASICOS 1994",
    }
    found: dict[str, Path] = {}
    for path in DOCS_DIR.glob("*.docx"):
        flat = re.sub(r"\s+", " ", slugify(path.stem).replace("-", " ")).upper()
        for key, frag in wanted.items():
            if key not in found and frag in flat:
                found[key] = path
    missing = set(wanted) - set(found)
    if missing:
        raise SystemExit(f"Documentos fuente no encontrados en {DOCS_DIR}: {sorted(missing)}")
    return found


# --------------------------------------------------------------------------- sources


def parse_pea(path: Path, valid: set[str]) -> dict[str, dict[int, dict]]:
    """Ocupados / desocupados / ingreso anual for 2005 and 2025."""
    out: dict[str, dict[int, dict]] = {}
    for rows in docx_tables(path):
        for row in rows:
            if len(row) < 7:
                continue
            slug = dept_slug(row[0], valid)
            if not slug:
                continue
            vals = [num(c) for c in row[1:7]]
            if any(v is None for v in vals):
                continue
            oc05, des05, ing05, oc25, des25, ing25 = vals
            out[slug] = {
                2005: {
                    "poblacion_ocupada": int(oc05),
                    "poblacion_desocupada": int(des05),
                    "poblacion_activa": int(oc05 + des05),
                    "ingreso_medio_anual": ing05,
                },
                2025: {
                    "poblacion_ocupada": int(oc25),
                    "poblacion_desocupada": int(des25),
                    "poblacion_activa": int(oc25 + des25),
                    "ingreso_medio_anual": ing25,
                },
            }
    return out


def parse_materna(path: Path, valid: set[str]) -> dict[str, dict[int, dict]]:
    """Razón de mortalidad materna por 1.000 nacidos vivos, 2005 y 2025."""
    out: dict[str, dict[int, dict]] = {}
    for rows in docx_tables(path):
        for row in rows:
            if len(row) < 3:
                continue
            slug = dept_slug(row[0], valid)
            v05, v25 = num(row[1]), num(row[2])
            if not slug or v05 is None or v25 is None:
                continue
            out[slug] = {
                2005: {"mortalidad_materna": v05},
                2025: {"mortalidad_materna": v25},
            }
    return out


def parse_duplicacion(path: Path, valid: set[str]) -> dict[str, dict[int, dict]]:
    """Tasa anual de crecimiento y tiempo de duplicación (regla del 70), 2005.

    The document publishes both columns as a matched pair (t = 70 / r), so both are
    taken from it; the base file only carried the rate, rounded to one decimal.
    """
    out: dict[str, dict[int, dict]] = {}
    for rows in docx_tables(path):
        for row in rows:
            if len(row) < 3:
                continue
            slug = dept_slug(row[0], valid)
            tasa, anios = num(row[1]), num(row[2])
            if not slug or tasa is None or anios is None:
                continue
            out[slug] = {
                2005: {"crecimiento_anual_pct": tasa, "tiempo_duplicacion_anios": anios}
            }
    return out


def parse_nupcialidad(path: Path, valid: set[str]) -> dict[str, dict[int, dict]]:
    """Nupcialidad 2021-2025 and TGF 2022, attached to the 2025 snapshot.

    Columns: matrimonios totales | por 1.000 hab. | % uniones de hecho |
             edad 1ª unión (mujeres) | TGF 2022 | lectura.
    The first data row is the national line ("Guatemala (Nacional)") and is skipped;
    the departmental one is "Guatemala (Dpto)".
    """
    out: dict[str, dict[int, dict]] = {}
    for rows in docx_tables(path):
        for row in rows:
            if len(row) < 6 or "nacional" in row[0].lower():
                continue
            slug = dept_slug(row[0], valid)
            if not slug or slug in out:
                continue
            por_mil, pct_union, edad = num(row[2]), num(row[3]), num(row[4])
            if por_mil is None or pct_union is None or edad is None:
                continue
            if not (0 <= por_mil <= 20 and 0 <= pct_union <= 100 and 12 <= edad <= 40):
                continue
            out[slug] = {
                2025: {
                    "matrimonios_por_1000": por_mil,
                    "pct_uniones_consensuales": pct_union,
                    "edad_primera_union": edad,
                }
            }
    return out


def parse_idh1994(path: Path, valid: set[str]) -> dict[str, dict[int, dict]]:
    """IDH 1994 by departamento; the table is already sorted best → worst."""
    out: dict[str, dict[int, dict]] = {}
    rank = 0
    for rows in docx_tables(path):
        for row in rows:
            if len(row) < 2:
                continue
            slug = dept_slug(row[0], valid)
            idh = num(row[1])
            if not slug or idh is None or not (0.2 <= idh <= 1):
                continue
            rank += 1
            out[slug] = {1994: {"idh": idh, "idh_ranking": rank}}
    return out



# --- El libro de 1994 -------------------------------------------------------
#
# Un bloque por departamento, en prosa etiquetada:
#     EXTENSIÓN TERRITORIAL: 2,126 Km²
#     MORTALIDAD GENERAL ²/ : 7.7 personas mueren por cada 1,000 habitantes
#     INGRESO MEDIO ANUAL DE LA POBLACIÓN: Q. 10,311.70 para población ocupada
#
# Las llamadas a pie de página (¹/ ²/ ³/) se cuelan entre la etiqueta y la cifra, así
# que se quitan antes de leer el número.

LIBRO_1994: list[tuple[str, str]] = [
    ("poblacion_total", r"POBLACION ESTIMADA AN.?O 1994"),
    ("densidad_hab_km2", r"DENSIDAD DE POBLACION AN.?O 1991"),
    ("pct_mujeres", r"MUJERES"),
    ("pct_hombres", r"HOMBRES"),
    ("pct_urbana", r"URBANA"),
    ("pct_rural", r"RURAL"),
    ("pct_indigena", r"POBLACION IND.?IGENA"),
    ("esperanza_vida", r"ESPERANZA DE VIDA"),
    ("crecimiento_anual_pct", r"TASA ANUAL DE CRECIMIENTO"),
    ("fecundidad", r"TASA GLOBAL DE FECUNDIDAD"),
    ("mortalidad_general", r"MORTALIDAD GENERAL"),
    ("mortalidad_materna", r"MORTALIDAD MATERNA"),
    ("poblacion_activa", r"POBLACION ACTIVA"),
    ("poblacion_ocupada", r"POBLACION OCUPADA"),
    ("poblacion_desocupada", r"POBLACION DESOCUPADA"),
    ("ingreso_medio_anual", r"INGRESO MEDIO ANUAL"),
    ("_agua_personas", r"ACCESO POBLACIONAL A AGUA"),
    ("_saneamiento_personas", r"ACCESO POBLACIONAL A RED SANITARIA"),
]

LIMITES_1994: dict[str, tuple[float, float]] = {
    "poblacion_total": (50_000, 3_000_000),
    "densidad_hab_km2": (1, 3000),
    "pct_mujeres": (40, 60),
    "pct_hombres": (40, 60),
    "pct_urbana": (0, 100),
    "pct_rural": (0, 100),
    "pct_indigena": (0, 100),
    "esperanza_vida": (45, 90),
    "crecimiento_anual_pct": (0.5, 6),
    "fecundidad": (2, 9),
    "mortalidad_general": (1, 30),
    "mortalidad_materna": (1, 40),
    "poblacion_activa": (5_000, 2_000_000),
    "poblacion_ocupada": (3_000, 2_000_000),
    "poblacion_desocupada": (1_000, 2_000_000),
    "ingreso_medio_anual": (500, 50_000),
    "superficie_km2": (400, 40_000),
    "_agua_personas": (10_000, 5_000_000),
    "_saneamiento_personas": (10_000, 5_000_000),
}

# Erratas del documento, corregidas con el propio libro como testigo: las 22 extensiones
# solo suman los 108,889 km² oficiales del país con estos dos valores.
ERRATAS_1994: dict[tuple[str, str], float] = {
    ("huehuetenango", "superficie_km2"): 7400.0,   # el libro imprime "1,400 Km²"
    ("solola", "pct_indigena"): 96.6,              # el libro imprime "296.6%"
}

SIN_NOTA = re.compile(r"\s*[¹²³1-3]\s*/")


def parse_libro_1994(path: Path, valid: set[str]) -> tuple[dict[str, dict[int, dict]], dict[str, float]]:
    """Devuelve (indicadores por departamento para 1994, superficies)."""
    lineas = docx_lines(path)
    bloques: dict[str, list[str]] = {}
    actual: str | None = None
    for i, linea in enumerate(lineas):
        cabecera = re.match(r"^DEPARTAMENTO DE (.+?)\s*$", _sin_tildes(linea))
        # el bloque de datos es el que va seguido de la extensión territorial
        if cabecera and i + 1 < len(lineas) and _sin_tildes(lineas[i + 1]).startswith("EXTENSION"):
            slug = ALIAS.get(slugify(cabecera.group(1)), slugify(cabecera.group(1)))
            actual = slug if slug in valid else None
            if actual:
                bloques[actual] = []
            continue
        if actual:
            bloques[actual].append(linea)

    def valor(slug: str, clave: str, bruto: float | None) -> float | None:
        errata = ERRATAS_1994.get((slug, clave))
        if errata is not None:
            return errata
        if bruto is None:
            return None
        lo, hi = LIMITES_1994.get(clave, (float("-inf"), float("inf")))
        return bruto if lo <= bruto <= hi else None

    indicadores: dict[str, dict[int, dict]] = {}
    superficies: dict[str, float] = {}
    for slug, bloque in bloques.items():
        campos: dict[str, float] = {}
        for linea in bloque:
            plano = SIN_NOTA.sub(" ", _sin_tildes(linea))
            if plano.startswith("EXTENSION TERRITORIAL"):
                sup = valor(slug, "superficie_km2", num(plano.split(":", 1)[-1]))
                if sup is not None:
                    superficies[slug] = sup
            if "TIEMPO DE DUPLICACION" in plano:
                m = re.search(r"(\d+)\s*AN.?OS?(?:\D+(\d+)\s*MES)?", plano)
                if m:
                    campos["tiempo_duplicacion_anios"] = round(
                        int(m.group(1)) + int(m.group(2) or 0) / 12, 2
                    )
            for clave, patron in LIBRO_1994:
                if clave in campos:
                    continue
                m = re.search(patron, plano)
                if not m:
                    continue
                v = valor(slug, clave, num(plano[m.end():]))
                if v is not None:
                    campos[clave] = v
        # el libro publica agua y saneamiento en personas; el resto del proyecto en %
        poblacion = campos.get("poblacion_total")
        for clave, destino in (("_agua_personas", "acceso_agua_pct"),
                               ("_saneamiento_personas", "acceso_saneamiento_pct")):
            personas = campos.pop(clave, None)
            if personas and poblacion:
                campos[destino] = round(min(personas / poblacion * 100, 100), 2)
        indicadores[slug] = {1994: campos}
    return indicadores, superficies


# Lo que el libro de 1994 no trae, y por qué no se rellena:
#  · analfabetismo: el libro no incluye ningún indicador educativo (el IDH 1994 sí trae
#    un subíndice de educación, pero no es convertible a tasa de analfabetismo).
#  · Quetzaltenango: falta la línea de población 1994 (solo imprime 1991 = 473,800 y
#    2000 = 609,590). Sin ella tampoco salen su densidad ni sus % de agua y saneamiento,
#    que el libro publica en personas. No se interpola: las cifras de 1994 del libro no
#    son consistentes con sus propias series 1991-2000, así que cualquier estimación
#    tendría otra naturaleza que las 21 restantes.
HUECOS_LIBRO_1994 = [
    "analfabetismo_pct: el libro de 1994 no trae ningún indicador educativo (0/22)",
    "quetzaltenango: el libro omite su población de 1994; sin ella no hay densidad "
    "ni % de agua/saneamiento para ese departamento",
]


def _sin_tildes(s: str) -> str:
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().upper().strip()


# --------------------------------------------------------------------------- apply


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    valid = {d["slug"] for d in data}
    docs = load_docs()

    libro94, superficies94 = parse_libro_1994(docs["libro1994"], valid)

    sources = [
        ("Libro 1994 (corte completo)", libro94),
        ("PEA / ingresos 2005 y 2025", parse_pea(docs["pea"], valid)),
        ("Mortalidad materna 2005 y 2025", parse_materna(docs["materna"], valid)),
        ("Duplicación de la población 2005", parse_duplicacion(docs["duplicacion"], valid)),
        ("Nupcialidad y TGF (2025)", parse_nupcialidad(docs["fecundidad"], valid)),
        ("IDH 1994", parse_idh1994(docs["idh1994"], valid)),
    ]

    por_depto = {d["slug"]: {i["anio"]: i for i in d["indicadores"]} for d in data}
    report: list[tuple[str, int, int]] = []

    for label, parsed in sources:
        escritos = 0
        for slug, por_anio in parsed.items():
            for anio, campos in por_anio.items():
                ind = por_depto[slug].get(anio)
                if ind is None:
                    continue
                for key, value in campos.items():
                    ind[key] = value
                    escritos += 1
        report.append((label, len(parsed), escritos))

    # La extensión territorial vive en el departamento, no en el corte anual. La del
    # libro de 1994 es la oficial: las 22 suman 108,889 km², el total del país.
    corregidas = []
    for depto in data:
        nueva = superficies94.get(depto["slug"])
        if nueva is not None and nueva != depto.get("superficie_km2"):
            corregidas.append((depto["slug"], depto.get("superficie_km2"), nueva))
            depto["superficie_km2"] = nueva

    # Indicadores derivados: densidad = población/superficie, duplicación = 70/tasa.
    # La superficie vive en el departamento, no en el corte anual.
    derivados = {"calculado": 0, "corregido": 0}
    for depto in data:
        for ind in depto["indicadores"]:
            for motivo, n in completar(ind, depto.get("superficie_km2")).items():
                derivados[motivo] += n

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Actualizado {DATA.relative_to(ROOT)}\n")
    for label, deptos, campos in report:
        estado = "OK " if deptos == len(valid) else "!! "
        print(f"  {estado}{label:34} {deptos:2}/22 departamentos · {campos:3} valores")

    if corregidas:
        print(f"\n  Extensión territorial corregida con el libro de 1994 ({len(corregidas)}):")
        for slug, antes, ahora in corregidas:
            print(f"     {slug:16} {antes} -> {ahora} km²")
        print(f"     suma nacional: {sum(d['superficie_km2'] for d in data):,.0f} km² "
              f"(oficial 108,889)\n")

    print(f"  OK {'Derivados (densidad, duplicación)':34} "
          f"{derivados['calculado']:3} calculados · {derivados['corregido']:3} corregidos")

    print("\nHuecos conocidos de la fuente:")
    for hueco in HUECOS_LIBRO_1994:
        print(f"  · {hueco}")
    print("  · mortalidad_general 2005 y 2025: ningún documento la publica por "
          "departamento (solo el nacional 2025, ~4.9-5.3 por mil)")

    print("\nCobertura por año (de 22 departamentos):")
    keys = [
        "poblacion_activa", "poblacion_ocupada", "poblacion_desocupada",
        "ingreso_medio_anual", "mortalidad_general", "mortalidad_materna",
        "fecundidad", "crecimiento_anual_pct", "tiempo_duplicacion_anios",
        "matrimonios_por_1000", "pct_uniones_consensuales", "edad_primera_union",
        "idh", "idh_ranking",
    ]
    anios = sorted({i["anio"] for d in data for i in d["indicadores"]})
    print(f"  {'campo':26}" + "".join(f"{a:>7}" for a in anios))
    for key in keys:
        fila = [
            sum(1 for d in data for i in d["indicadores"] if i["anio"] == a and i.get(key) is not None)
            for a in anios
        ]
        print(f"  {key:26}" + "".join(f"{n:>7}" for n in fila))


if __name__ == "__main__":
    main()
