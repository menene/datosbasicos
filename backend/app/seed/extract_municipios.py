"""Extract municipio profiles from the raw .docx source documents in /docs.

Two kinds of source coexist:

1. Prose department docs — one labeled block per municipio ("Población total: …").
   Formats vary (label wording, decimal separators, ✅ markers, prose vs. structured),
   so the parser is deliberately tolerant and reports what it could not match.
2. Table docs — a grid with one row per municipio. Two of these are parsed:
   · "Municipios del Departamento de Guatemala — Datos Demográficos y Servicios",
     the only source covering the 17 municipios of the capital department.
   · "POBLACIÓN ECONÓMICAMENTE ACTIVA E INACTIVA POR DEPARTAMENTOS", which adds
     PEA / PEI (Censo 2018, base 15 años y más) to municipios country-wide.
   · "VOTANTES DEPTOS REP. DE GUATEMALA", padrón, votos emitidos, abstencionismo y
     participación de las Elecciones Generales 2023 (primera vuelta).

The PEA tables carry stray rows (municipios listed under the wrong department, and
names that are not municipios at all), so each table's department is decided by
majority vote over the municipio names it contains, and rows that do not belong to
the winning department are dropped.

Fields not present in any doc (mortalidad, ingresos, IDH) are left null and flagged.

Run from repo root:
    python -m backend.app.seed.extract_municipios      (or python backend/app/seed/extract_municipios.py)

Writes backend/app/seed/data/municipios.json and prints a coverage report.
"""
from __future__ import annotations

import difflib
import json
import re
import unicodedata
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

try:  # runs both as `python backend/app/seed/extract_municipios.py` and as a module
    from app.seed.derivados import completar
except ImportError:  # pragma: no cover - depends on how the script is invoked
    import sys as _sys
    _sys.path.insert(0, str(Path(__file__).resolve().parent))
    from derivados import completar

ROOT = Path(__file__).resolve().parents[3]
DOCS_DIR = ROOT / "docs"
DATA_DIR = Path(__file__).resolve().parent / "data"
GEOJSON = DATA_DIR / "guatemala_municipios.geojson"
OUT = DATA_DIR / "municipios.json"

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

DEPARTAMENTOS = [
    "Alta Verapaz", "Baja Verapaz", "Chimaltenango", "Chiquimula", "El Progreso",
    "Escuintla", "Guatemala", "Huehuetenango", "Izabal", "Jalapa", "Jutiapa",
    "Petén", "Quetzaltenango", "Quiché", "Retalhuleu", "Sacatepéquez", "San Marcos",
    "Santa Rosa", "Sololá", "Suchitepéquez", "Totonicapán", "Zacapa",
]


def slugify(name: str) -> str:
    n = unicodedata.normalize("NFD", name).encode("ascii", "ignore").decode()
    n = n.lower().strip()
    n = re.sub(r"[\s_]+", "-", n)
    n = re.sub(r"[^a-z0-9-]", "", n)
    return re.sub(r"-+", "-", n).strip("-")


def docx_lines(path: Path) -> list[str]:
    xml = zipfile.ZipFile(path).read("word/document.xml").decode("utf-8", "ignore")
    xml = re.sub(r"</w:p>", "\n", xml)
    txt = re.sub(r"<[^>]+>", "", xml)
    txt = txt.replace(" ", " ")
    return [re.sub(r"[ \t]+", " ", l).strip() for l in txt.split("\n") if l.strip()]


def parse_num(s: str) -> float | None:
    """Parse a Guatemalan-formatted number, tolerating comma/dot/space separators."""
    s = s.strip().replace(" ", " ")
    s = re.sub(r"(?<=\d)\s(?=\d{3}\b)", "", s)  # spaced thousands: "2 690" -> "2690"
    m = re.search(r"\d[\d.,]*", s)
    if not m:
        return None
    tok = m.group(0).strip(".,")
    if "," in tok and "." in tok:
        # last separator is the decimal one
        if tok.rfind(",") > tok.rfind("."):
            tok = tok.replace(".", "").replace(",", ".")
        else:
            tok = tok.replace(",", "")
    else:
        # Single separator kind: it's a thousands grouping only when it groups
        # exactly 3 trailing digits ("5.311", "9,628"); otherwise it's decimal.
        for sep in (",", "."):
            if tok.count(sep) > 1:
                tok = tok.replace(sep, "")
            elif sep in tok:
                after = tok.split(sep)[1]
                tok = tok.replace(sep, "") if len(after) == 3 else tok.replace(sep, ".")
    try:
        return float(tok)
    except ValueError:
        return None


def first_pct(s: str) -> float | None:
    m = re.search(r"([\d.,]+)\s*%", s)
    return parse_num(m.group(1)) if m else None


def dept_for_file(path: Path) -> str | None:
    up = unicodedata.normalize("NFD", path.name).encode("ascii", "ignore").decode().upper()
    best = None
    for d in DEPARTAMENTOS:
        key = unicodedata.normalize("NFD", d).encode("ascii", "ignore").decode().upper()
        if key in up:
            if best is None or len(key) > len(best[1]):
                best = (d, key)
    return best[0] if best else None


# Field -> list of (regex on label line, extractor). First match wins.
def field_value(line: str, kind: str) -> float | None:
    val = line.split(":", 1)[1] if ":" in line else line
    if kind == "pct":
        return first_pct(val)
    if kind == "num":
        return parse_num(val)
    return None


LABELS: list[tuple[str, str, str]] = [
    # (indicator key, label regex, kind)
    ("superficie_km2", r"superficie", "num"),
    ("poblacion_total", r"poblaci.n total", "num"),
    ("densidad_hab_km2", r"densidad", "num"),
    ("pct_hombres", r"^hombres", "pct"),
    ("pct_mujeres", r"^mujeres", "pct"),
    ("pct_urbana", r"poblaci.n urbana", "pct"),
    ("pct_rural", r"poblaci.n rural", "pct"),
    ("pct_indigena", r"poblaci.n ind.gena", "pct"),
    ("esperanza_vida", r"esperanza de vida", "num"),
    ("analfabetismo_pct", r"analfabetismo", "pct"),
    ("acceso_agua_pct", r"agua", "pct"),
    ("acceso_saneamiento_pct", r"(saneamiento|red sanitaria|drenaje|alcantarillado)", "pct"),
    ("fecundidad", r"fecundidad", "num"),
    ("crecimiento_anual_pct", r"crecimiento", "pct"),
]

CLEAN_MARKERS = re.compile(r"^[\s✅📌•\-\*]+")

# Plausibility bounds. A parsed value outside its range is almost always the parser
# grabbing a stray number (a year, a footnote, a prose range) — discard it as missing
# rather than store a wrong value.
BOUNDS: dict[str, tuple[float, float]] = {
    "superficie_km2": (5, 15000),   # el municipio más pequeño del país ronda 7 km²
    "poblacion_total": (300, 2_000_000),
    "densidad_hab_km2": (1, 8000),  # el máximo real ronda 5.000 hab/km² (capital)
    "pct_hombres": (30, 70),
    "pct_mujeres": (30, 70),
    "pct_urbana": (0, 100),
    "pct_rural": (0, 100),
    "pct_indigena": (0, 100),
    "esperanza_vida": (45, 90),
    "analfabetismo_pct": (0, 100),
    "acceso_agua_pct": (0, 100),
    "acceso_saneamiento_pct": (0, 100),
    "fecundidad": (0.5, 8),
    "crecimiento_anual_pct": (-5, 10),
    "tiempo_duplicacion_anios": (5, 200),
    "poblacion_activa": (200, 1_500_000),
    "poblacion_inactiva": (200, 1_500_000),
    "pct_pea": (20, 80),
    "padron_electoral": (500, 3_000_000),
    "votos_emitidos": (100, 3_000_000),
    "abstencionismo_pct": (5, 95),
    "participacion_pct": (5, 95),
}

# Keys sourced from the table docs rather than from the prose LABELS.
EXTRA_KEYS = [
    "tiempo_duplicacion_anios",
    "poblacion_activa",
    "poblacion_inactiva",
    "pct_pea",
    "padron_electoral",
    "votos_emitidos",
    "abstencionismo_pct",
    "participacion_pct",
]


def parse_block(lines: list[str]) -> dict:
    out: dict[str, float | None] = {}
    for raw in lines:
        line = CLEAN_MARKERS.sub("", raw)
        low = unicodedata.normalize("NFD", line).encode("ascii", "ignore").decode().lower()
        for key, pat, kind in LABELS:
            if key in out:
                continue
            if re.search(pat, low):
                v = field_value(line, kind)
                if v is not None:
                    lo, hi = BOUNDS.get(key, (float("-inf"), float("inf")))
                    if lo <= v <= hi:
                        out[key] = v
                break
    return out


HEADER_NOISE = re.compile(r"^(?:Municipio de|Descripci.n del municipio de)\s+", re.I)
# Prose openers that masquerade as headers ("Se ubica en…, …", "A nivel…, …").
PROSE_STOP = re.compile(
    r"^(se |a nivel|est. |en |si |no se|para |como |desde |durante |seg.n )",
    re.I,
)


def _clean_name(muni: str) -> str | None:
    muni = HEADER_NOISE.sub("", muni.strip()).strip(" .()")
    if not (2 <= len(muni) <= 60) or re.search(r"\d", muni):
        return None
    if PROSE_STOP.match(muni) or len(muni.split()) > 6:  # reject prose sentences
        return None
    return muni


def is_header(line: str, dept: str) -> str | None:
    """Return the municipio name if `line` looks like a block header for `dept`."""
    line = line.strip().strip(".")
    dslug = slugify(dept)
    # "X es un municipio [situado] ... departamento de Y" — strong signal; the header
    # is sometimes a full descriptive sentence (with colons), so check it first.
    m = re.match(r"^(.+?)\s+es un municipio\b.*?departamento de\s+.+$", line, re.I)
    if m:
        return _clean_name(m.group(1))
    if ":" in line or "✅" in line or line.isupper():
        return None
    # Parenthetical dept: "Descripción del municipio de San José Chacayá (Sololá, Guatemala)"
    m = re.match(r"^(.+?)\s*\(([^)]+)\)\s*$", line)
    if m and (dslug in slugify(m.group(2)) or "departamento" in slugify(m.group(2))):
        return _clean_name(m.group(1))
    # Standard: "San José Poaquil, Chimaltenango" / "Municipio de X, Departamento de Y"
    m = re.match(r"^(?:Municipio de\s+|Descripci.n del municipio de\s+)?(.+?),\s*(.+)$", line, re.I)
    if m:
        tail = slugify(m.group(2))
        if dslug in tail or "departamento" in tail or "depto" in tail:
            return _clean_name(m.group(1))
    return None


def extract_doc(path: Path) -> tuple[str, list[tuple[str, dict]]]:
    dept = dept_for_file(path)
    if not dept:
        return "", []
    lines = docx_lines(path)
    blocks: list[tuple[str, list[str]]] = []
    current: tuple[str, list[str]] | None = None
    for line in lines:
        muni = is_header(line, dept)
        if muni:
            if current:
                blocks.append(current)
            current = (muni, [])
        elif current:
            current[1].append(line)
    if current:
        blocks.append(current)
    return dept, [(m, parse_block(ls)) for m, ls in blocks]


STOPWORDS = {"la", "el", "los", "las", "de", "del", "san", "santa", "santo"}


def tokens(slug: str) -> set[str]:
    return {t for t in slug.split("-") if t and t not in STOPWORDS}


def geojson_index() -> dict[tuple[str, str], str]:
    gj = json.loads(GEOJSON.read_text(encoding="utf-8"))
    idx = {}
    for f in gj["features"]:
        p = f["properties"]
        name = p["shapeName"]
        if "lago" in slugify(name):  # lakes are not municipios
            continue
        idx[(slugify(p["departamento"]), slugify(name))] = name
    return idx


def match_geo(geo: dict[tuple[str, str], str], dslug: str, mslug: str) -> str | None:
    if (dslug, mslug) in geo:
        return geo[(dslug, mslug)]
    in_dept = {m: g for (d, m), g in geo.items() if d == dslug}
    # substring either direction
    cand = [g for m, g in in_dept.items() if mslug in m or m in mslug]
    if len(cand) == 1:
        return cand[0]
    # distinctive-token overlap (ignoring articles/San/Santa)
    mt = tokens(mslug)
    if mt:
        scored = [(len(mt & tokens(m)), g) for m, g in in_dept.items()]
        scored.sort(reverse=True)
        if scored and scored[0][0] and (len(scored) == 1 or scored[0][0] > scored[1][0]):
            return scored[0][1]
    # spelling variants only ("San Raymundo" / "San Raimundo"); the cutoff is tight
    # on purpose so distinct municipios ("Santa Ana Huista" vs "San Antonio Huista")
    # are never conflated.
    close = difflib.get_close_matches(mslug, list(in_dept), n=1, cutoff=0.9)
    return in_dept[close[0]] if close else None


def match_geo_nacional(geo: dict, mslug: str) -> tuple[str, str] | None:
    """Last resort for the department docs: an exact, country-wide unique name.

    A few municipios sit under the wrong department in the GeoJSON (Chicamán and
    San Felipe, notably). Their prose profile is unambiguous, so the shape is matched
    by name and the record keeps the department its source document states.
    """
    hits = [(d, m) for (d, m) in geo if m == mslug]
    return hits[0] if len(hits) == 1 else None


# --------------------------------------------------------------- table sources

# Documents parsed as grids. They must be skipped by the prose pass: their cells,
# once flattened into lines, look like unlabeled prose and yield junk blocks.
TABLE_DOCS = {
    "guatemala": "municipios del departamento de guatemala datos demograficos",
    "pea": "poblacion economicamente activa e inactiva por departamentos",
    "votantes": "votantes deptos rep de guatemala",
}


def norm(s: str) -> str:
    """Lowercase, unaccented, whitespace-collapsed — punctuation kept (headers use %)."""
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s).strip().lower()


def docx_tables(path: Path) -> list[list[list[str]]]:
    """Every table in the document, as rows of cell strings."""
    root = ET.fromstring(zipfile.ZipFile(path).read("word/document.xml"))
    tables = []
    for tbl in root.iter(f"{W}tbl"):
        rows = []
        for tr in tbl.findall(f"{W}tr"):
            rows.append([
                re.sub(r"\s+", " ", "".join(t.text or "" for t in tc.iter(f"{W}t"))).strip()
                for tc in tr.findall(f"{W}tc")
            ])
        tables.append(rows)
    return tables


def _nombre_plano(path: Path) -> str:
    """Nombre de archivo sin acentos ni puntuación, para comparar con TABLE_DOCS."""
    return slugify(path.stem).replace("-", " ")


def is_table_doc(path: Path) -> bool:
    return any(frag in _nombre_plano(path) for frag in TABLE_DOCS.values())


def find_doc(fragment: str) -> Path | None:
    for path in sorted(DOCS_DIR.glob("*.docx")):
        if fragment in _nombre_plano(path):
            return path
    return None


# Row labels that are totals, notes or placeholders rather than a municipio.
NOT_A_MUNICIPIO = re.compile(
    r"^(departamento|total|otros? municipios|resto|territorio|municipio)\b|^$", re.I
)


def clean_row_name(cell: str) -> str | None:
    """"Guatemala (Ciudad)" / "Zacapa (cabecera)" / "Cobán*" -> plain municipio name."""
    name = re.sub(r"\(.*?\)", " ", cell)            # (cabecera), (Ciudad), (aprox)
    name = name.replace("*", " ").strip(" .,;:")
    if not name or NOT_A_MUNICIPIO.match(name) or re.search(r"\d", name):
        return None
    return name


def nombres_fila(cell: str) -> list[str]:
    """Nombres candidatos de una celda: el texto y, si lo hay, el paréntesis.

    El padrón capitalino aparece como "Distrito Central (Guatemala)": ahí el municipio
    es justamente lo que va entre paréntesis.
    """
    candidatos = []
    base = clean_row_name(cell)
    if base:
        candidatos.append(base)
    for dentro in re.findall(r"\(([^)]+)\)", cell):
        limpio = clean_row_name(dentro)
        if limpio and limpio not in candidatos:
            candidatos.append(limpio)
    return candidatos


def emparejar(geo: dict, dslug: str, cell: str) -> str | None:
    for nombre in nombres_fila(cell):
        geo_name = match_geo(geo, dslug, slugify(nombre))
        if geo_name:
            return geo_name
    return None


def vote_department(geo: dict, names: list[str]) -> str | None:
    """Pick the department whose municipio list explains most of these row names.

    The PEA tables mislabel some sections and mix in rows from other departments,
    so the table's own contents decide, not its heading.
    """
    scores: dict[str, int] = {}
    for name in names:
        mslug = slugify(name)
        for dslug in {d for d, _ in geo}:
            if match_geo(geo, dslug, mslug):
                scores[dslug] = scores.get(dslug, 0) + 1
    if not scores:
        return None
    ranked = sorted(scores.items(), key=lambda kv: -kv[1])
    top, n = ranked[0]
    if n < 3 or (len(ranked) > 1 and n == ranked[1][1]):
        return None
    return top


def guatemala_table(geo: dict) -> dict[tuple[str, str], dict]:
    """The 17 municipios of the Guatemala department (2025 projections table)."""
    path = find_doc(TABLE_DOCS["guatemala"])
    if path is None:
        return {}
    COLS = [
        ("poblacion_total", r"poblacion total"),
        ("pct_urbana", r"urbana"),
        ("pct_rural", r"rural"),
        ("hombres_abs", r"hombres"),
        ("mujeres_abs", r"mujeres"),
        ("pct_indigena", r"indigena"),
        ("crecimiento_anual_pct", r"crecimiento"),
        ("tiempo_duplicacion_anios", r"duplicacion"),
        ("fecundidad", r"fecundidad"),
        ("acceso_agua_pct", r"agua"),
        ("acceso_saneamiento_pct", r"drenaje"),
    ]
    out: dict[tuple[str, str], dict] = {}
    for rows in docx_tables(path):
        if len(rows) < 5:
            continue
        header = [norm(c) for c in rows[0]]
        idx = {}
        for key, pat in COLS:
            for i, h in enumerate(header):
                if i and re.search(pat, h) and i not in idx.values():
                    idx[key] = i
                    break
        if "poblacion_total" not in idx or "fecundidad" not in idx:
            continue
        for row in rows[1:]:
            name = clean_row_name(row[0]) if row else None
            if not name:
                continue
            geo_name = match_geo(geo, "guatemala", slugify(name))
            if geo_name is None:
                continue
            fields: dict[str, float] = {}
            for key, i in idx.items():
                if i < len(row) and (v := parse_num(row[i])) is not None:
                    fields[key] = v
            h, m = fields.pop("hombres_abs", None), fields.pop("mujeres_abs", None)
            if h and m:
                fields["pct_hombres"] = round(h / (h + m) * 100, 2)
                fields["pct_mujeres"] = round(m / (h + m) * 100, 2)
            fields = {
                k: v for k, v in fields.items()
                if BOUNDS.get(k, (float("-inf"), float("inf")))[0] <= v
                <= BOUNDS.get(k, (float("-inf"), float("inf")))[1]
            }
            if len(fields) >= 5:
                out[("guatemala", slugify(geo_name))] = fields
    return out


def pea_columns(rows: list[list[str]]) -> tuple[dict[str, int], int]:
    """Locate the PEA/PEI columns; returns (column map, index of the first data row).

    Two header shapes occur: a single row ("PEA (Absoluto aprox)", "% PEA") and a
    two-row one where "Absoluto"/"%" sit under a merged PEA / PEI heading.
    """
    top = list(rows[0])
    for i in range(1, len(top)):                       # forward-fill merged headings
        if not top[i].strip():
            top[i] = top[i - 1]
    second = rows[1] if len(rows) > 1 else []
    two_row = any(re.search(r"absoluto|^\s*%\s*$", c, re.I) for c in second)
    parts = [f"{a} {b}" for a, b in zip(top, (second + [""] * len(top)) if two_row else [""] * len(top))]
    header = [norm(h) for h in parts]

    cols: dict[str, int] = {}
    for i, h in enumerate(header):
        if i == 0:
            continue
        pct = "%" in h or "porcentaje" in h
        if "pea" in h or "economicamente activa" in h:
            cols.setdefault("pea_pct" if pct else "pea", i)
        elif "pei" in h or "economicamente inactiva" in h:
            cols.setdefault("pei_pct" if pct else "pei", i)
        elif "15" in h:
            cols.setdefault("base15", i)
        elif "total" in h:
            cols.setdefault("total", i)
    return cols, 2 if two_row else 1


def pea_tables(geo: dict) -> dict[tuple[str, str], dict]:
    """PEA / PEI per municipio (Censo 2018, base 15 años y más)."""
    path = find_doc(TABLE_DOCS["pea"])
    if path is None:
        return {}
    out: dict[tuple[str, str], dict] = {}
    for rows in docx_tables(path):
        if len(rows) < 4:
            continue
        cols, start = pea_columns(rows)
        if "pea" not in cols or "pei" not in cols:
            continue
        names = [n for r in rows[start:] if r and (n := clean_row_name(r[0]))]
        dslug = vote_department(geo, names)
        if dslug is None:
            continue
        for row in rows[start:]:
            name = clean_row_name(row[0]) if row else None
            if not name:
                continue
            geo_name = emparejar(geo, dslug, row[0])
            key = (dslug, slugify(geo_name)) if geo_name else None
            if key is None or key in out:               # first row for a municipio wins
                continue
            pea = parse_num(row[cols["pea"]]) if cols["pea"] < len(row) else None
            pei = parse_num(row[cols["pei"]]) if cols["pei"] < len(row) else None
            if pea is None or pei is None:
                continue
            fields = {"poblacion_activa": pea, "poblacion_inactiva": pei}
            # Alta/Baja Verapaz are only covered by this document; its "Población
            # Total 2018" column is the sole population figure for them. Approximate
            # cells ("~45.000", "(aprox)", "(revisado)") are skipped.
            i = cols.get("total")
            if i is not None and i < len(row) and not re.search(r"[~+]|aprox|revisad", row[i], re.I):
                if (total := parse_num(row[i])) is not None:
                    fields["poblacion_total_censo2018"] = total
            i = cols.get("pea_pct")
            pct = parse_num(row[i]) if i is not None and i < len(row) else None
            if pct is None and pea + pei:
                pct = round(pea / (pea + pei) * 100, 1)
            fields["pct_pea"] = pct
            fields = {
                k: v for k, v in fields.items()
                if v is not None
                and BOUNDS.get(k, (float("-inf"), float("inf")))[0] <= v
                <= BOUNDS.get(k, (float("-inf"), float("inf")))[1]
            }
            if "poblacion_activa" in fields:
                out[key] = fields
    return out


DEPT_NAME = {slugify(d): d for d in DEPARTAMENTOS}

ALL_KEYS = [k for k, _, _ in LABELS] + EXTRA_KEYS


def votantes_tablas(geo: dict) -> dict[tuple[str, str], dict]:
    """Padrón y participación por municipio — Elecciones Generales 2023, 1ª vuelta.

    Columnas: Municipio | Padrón | Votos Emitidos | Abstencionismo | % Abstencionismo |
    % Participación. Cada departamento trae primero la tabla de primera vuelta y algunos
    repiten después la de segunda: como el primer registro de cada municipio gana, se
    queda la primera vuelta. El departamento sale de los propios nombres de las filas.
    """
    path = find_doc(TABLE_DOCS["votantes"])
    if path is None:
        return {}
    out: dict[tuple[str, str], dict] = {}
    for rows in docx_tables(path):
        if len(rows) < 4:
            continue
        cabecera = [norm(c) for c in rows[0]]
        if not cabecera or "municipio" not in cabecera[0] or len(cabecera) < 6:
            continue
        if not any("padron" in c for c in cabecera):
            continue
        nombres = [n for r in rows[1:] if r and (n := clean_row_name(r[0]))]
        dslug = vote_department(geo, nombres)
        if dslug is None:
            continue
        for row in rows[1:]:
            nombre = clean_row_name(row[0]) if row else None
            if not nombre or len(row) < 6:
                continue
            geo_name = emparejar(geo, dslug, row[0])
            clave = (dslug, slugify(geo_name)) if geo_name else None
            if clave is None or clave in out:
                continue
            # Varias filas traen la cifra marcada como aproximada ("~11,430",
            # "18, approx.", "(repetición)"). El padrón y los votos son registros
            # exactos por naturaleza: si el documento los estima, no se guardan.
            exacto = lambda c: None if re.search(r"[~]|aprox|approx|repetici", c, re.I) else parse_num(c)
            padron, votos = exacto(row[1]), exacto(row[2])
            if padron is None:
                continue
            if votos is not None and not (0 < votos <= padron):
                votos = None    # San José del Golfo aparece con 0 votos emitidos
            campos = {
                "padron_electoral": padron,
                "votos_emitidos": votos,
                "abstencionismo_pct": exacto(row[4]) if votos else None,
                "participacion_pct": exacto(row[5]) if votos else None,
            }
            campos = {
                k: v for k, v in campos.items()
                if v is not None and BOUNDS[k][0] <= v <= BOUNDS[k][1]
            }
            if "padron_electoral" in campos:
                out[clave] = campos
    return out


def main() -> None:
    geo = geojson_index()
    fields_by_muni: dict[tuple[str, str], dict] = {}
    unmatched = []

    # 1. Prose department docs — one labeled block per municipio.
    for path in sorted(DOCS_DIR.glob("*.docx")):
        if is_table_doc(path):
            continue
        dept, blocks = extract_doc(path)
        if not dept:
            continue
        dslug = slugify(dept)
        for muni, fields in blocks:
            if len(fields) < 4:  # too few fields → likely a prose false-positive block
                continue
            geo_name = match_geo(geo, dslug, slugify(muni))
            clave = (dslug, slugify(geo_name)) if geo_name else match_geo_nacional(geo, slugify(muni))
            if clave is None:
                unmatched.append((dept, muni, len(fields)))
                continue
            # The document's department wins over the GeoJSON's attribution.
            fields_by_muni[clave] = {**fields, "_departamento": dept}

    # 2. Table docs. The Guatemala table is the only source for the capital
    #    department, so it also creates records; PEA adds columns to any municipio.
    fuentes = [
        ("tabla Guatemala", guatemala_table(geo)),
        ("PEA/PEI 2018", pea_tables(geo)),
        ("Votantes 2023", votantes_tablas(geo)),
    ]
    aportes = []
    for label, parsed in fuentes:
        nuevos = sum(1 for k in parsed if k not in fields_by_muni)
        for key, fields in parsed.items():
            registro = fields_by_muni.setdefault(key, {})
            # Una densidad publicada corresponde a la población con la que se calculó:
            # si esta fuente trae otra población, la densidad anterior queda obsoleta y
            # se descarta para recalcularla en el paso 4.
            nueva_pob = fields.get("poblacion_total")
            if nueva_pob is not None and registro.get("poblacion_total") != nueva_pob:
                registro.pop("densidad_hab_km2", None)
            registro.update(fields)
        aportes.append((label, len(parsed), nuevos))

    # 3. Population fallback + consistency check on the PEA figures. PEA + PEI is the
    #    population aged 15 and over, so it cannot exceed the municipio's total; where
    #    it does, the PEA table is the unreliable side and its trio is dropped.
    incoherentes = 0
    for fields in fields_by_muni.values():
        censo = fields.pop("poblacion_total_censo2018", None)
        if fields.get("poblacion_total") is None and censo is not None:
            fields["poblacion_total"] = censo
        total, pea = fields.get("poblacion_total"), fields.get("poblacion_activa")
        pei = fields.get("poblacion_inactiva") or 0
        if total and pea and pea + pei > total:
            for k in ("poblacion_activa", "poblacion_inactiva", "pct_pea"):
                fields.pop(k, None)
            incoherentes += 1

    # 4. Indicadores derivados: densidad = población/superficie y duplicación = 70/tasa.
    #    Ver derivados.py: se calculan cuando faltan y sustituyen al valor publicado
    #    cuando este contradice a la fórmula (densidades que quedaron atadas a una
    #    población anterior, o erratas del documento).
    derivados = {"calculado": 0, "corregido": 0}
    for fields in fields_by_muni.values():
        for motivo, n in completar(fields).items():
            derivados[motivo] += n

    records = {}
    for (dslug, mslug), fields in fields_by_muni.items():
        dept = fields.get("_departamento") or DEPT_NAME[dslug]
        records[(dslug, mslug)] = {
            "slug": mslug,
            "nombre": geo[(dslug, mslug)],
            "departamento_slug": slugify(dept),
            "departamento": dept,
            **{k: fields.get(k) for k in ALL_KEYS},
        }

    out = sorted(records.values(), key=lambda r: (r["departamento_slug"], r["slug"]))
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    # ---- coverage report ----
    total_geo = len(geo)
    matched = len(records)
    field_keys = ALL_KEYS
    filled = {k: sum(1 for r in out if r.get(k) is not None) for k in field_keys}
    print(f"Wrote {OUT.relative_to(ROOT)}")
    print(f"GeoJSON municipios: {total_geo} | matched with data: {matched} "
          f"({matched/total_geo*100:.0f}%) | missing: {total_geo - matched}")
    print("\nTable sources:")
    for label, n, nuevos in aportes:
        print(f"  {label:16} {n:3} municipios ({nuevos} nuevos)")
    print(f"  {'derivados':16} {derivados['calculado']:3} calculados, "
          f"{derivados['corregido']:3} corregidos (densidad y duplicación)")
    print(f"  {'descartados':16} {incoherentes:3} PEA/PEI incoherentes (PEA+PEI > población)")

    # Comprobación cruzada: el padrón de los municipios debe sumar el del departamento.
    deptos = json.loads((DATA_DIR / "departamentos.json").read_text(encoding="utf-8"))
    total_depto = {
        d["slug"]: next(
            (i.get("padron_electoral") for i in d["indicadores"] if i["anio"] == 2025), None
        )
        for d in deptos
    }
    suma: dict[str, float] = {}
    for r in out:
        if r.get("padron_electoral"):
            suma[r["departamento_slug"]] = suma.get(r["departamento_slug"], 0) + r["padron_electoral"]
    cuadran = [k for k, v in suma.items() if total_depto.get(k) and abs(v - total_depto[k]) / total_depto[k] < 0.0005]
    print(f"  {'padrón':16} {len(cuadran):3} de {len(suma)} departamentos cuadran exactamente "
          f"con la suma de sus municipios")
    descuadres = sorted(
        ((k, v, total_depto[k]) for k, v in suma.items()
         if total_depto.get(k) and k not in cuadran),
        key=lambda x: abs(x[1] - x[2]) / x[2], reverse=True,
    )
    for k, v, t in descuadres:
        print(f"       {k:16} {v:>10,.0f} vs {t:>10,}  ({(v - t) / t * 100:+.1f}%, "
              f"el documento omite o aproxima municipios)")
    print("\nField fill rate (of matched):")
    for k in field_keys:
        print(f"  {k:24} {filled[k]:3}/{matched}")
    if unmatched:
        print(f"\nParsed but unmatched to GeoJSON ({len(unmatched)}):")
        for d, m, n in unmatched:
            print(f"  {d} / {m}  ({n} fields)")
    have = set(records.keys())
    missing = [g for (k, g) in geo.items() if k not in have]
    if missing:
        print(f"\nGeoJSON municipios with NO data ({len(missing)}):")
        for g in sorted(missing)[:80]:
            print(f"  {g}")


if __name__ == "__main__":
    main()
