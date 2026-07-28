"""Extract municipio profiles from the raw .docx source documents in /docs.

Each department doc contains one block per municipio with labeled fields that map
onto the existing Indicador schema. Formats vary (label wording, decimal separators,
✅ markers, prose vs. structured), so the parser is deliberately tolerant and reports
what it could not match. Fields not present in the docs (mortalidad, economía, IDH)
are left null and flagged.

Run from repo root:
    python -m backend.app.seed.extract_municipios      (or python backend/app/seed/extract_municipios.py)

Writes backend/app/seed/data/municipios.json and prints a coverage report.
"""
from __future__ import annotations

import json
import re
import unicodedata
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DOCS_DIR = ROOT / "docs"
DATA_DIR = Path(__file__).resolve().parent / "data"
GEOJSON = DATA_DIR / "guatemala_municipios.geojson"
OUT = DATA_DIR / "municipios.json"

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
    "superficie_km2": (1, 15000),
    "poblacion_total": (300, 2_000_000),
    "densidad_hab_km2": (1, 60000),
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
}


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
    return None


def main() -> None:
    geo = geojson_index()
    records: dict[tuple[str, str], dict] = {}
    unmatched = []
    for path in sorted(DOCS_DIR.glob("*.docx")):
        dept, blocks = extract_doc(path)
        if not dept:
            continue
        dslug = slugify(dept)
        for muni, fields in blocks:
            if len(fields) < 4:  # too few fields → likely a prose false-positive block
                continue
            geo_name = match_geo(geo, dslug, slugify(muni))
            if geo_name is None:
                unmatched.append((dept, muni, len(fields)))
                continue
            records[(dslug, slugify(geo_name))] = {
                "slug": slugify(geo_name),
                "nombre": geo_name,
                "departamento_slug": dslug,
                "departamento": dept,
                **{k: fields.get(k) for k, _, _ in LABELS},
            }

    out = sorted(records.values(), key=lambda r: (r["departamento_slug"], r["slug"]))
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    # ---- coverage report ----
    total_geo = len(geo)
    matched = len(records)
    field_keys = [k for k, _, _ in LABELS]
    filled = {k: sum(1 for r in out if r.get(k) is not None) for k in field_keys}
    print(f"Wrote {OUT.relative_to(ROOT)}")
    print(f"GeoJSON municipios: {total_geo} | matched with data: {matched} "
          f"({matched/total_geo*100:.0f}%) | missing: {total_geo - matched}")
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
