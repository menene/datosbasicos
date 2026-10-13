"""Build the PDFs of the /anexos page from the Word documents in docs/agua.

Each .docx goes Word → HTML (pandoc) → PDF (headless Chrome), so the tables and
emoji of the source documents survive. Output: frontend/public/archivos/anexos/<slug>.pdf,
served at /archivos/anexos/<slug>.pdf by Vite in development and from dist/ in
production. Not under /anexos/: a folder with the same path as the /anexos page
would make a static server answer the page URL with the directory.

Run from the repo root (needs pandoc and Google Chrome):
    python3 scripts/build_anexos.py

The list below must match frontend/src/data/anexos.ts (same slugs and titles).
"""
from __future__ import annotations

import html
import re
import subprocess
import sys
import tempfile
import unicodedata
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs" / "agua"
OUT = ROOT / "frontend" / "public" / "archivos" / "anexos"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# (slug, title, start of the source filename)
ANEXOS = [
    ("vertiente-pacifico", "Estudio hidrosocial de la Vertiente del Pacífico",
     "Estudio Hidrosocial de la Vertiente del Pacífico"),
    ("cuenca-maria-linda", "Estudio hidrosocial de la cuenca del río María Linda",
     "ESTUDIO HIDROSOCIAL RÍO MARÍA LINDA"),
    ("vertiente-caribe", "Estudio hidrosocial de las cuencas de la Vertiente del Caribe",
     "Estudio Hidrosocial — Cuencas de la Vertiente del Caribe"),
    ("cuenca-cahabon-polochic", "Estudio hidrosocial de la cuenca Cahabón-Polochic",
     "ESTUDIO HIDROSOCIAL DE LA CUENCA CAHABÓN-POLOCHIC"),
    ("vertiente-golfo-de-mexico", "Estudio hidrosocial de la Vertiente del Golfo de México",
     "ESTUDIO CUENCAS GOLFO DE MÉXICO"),
    ("cuenca-usumacinta", "Estudio hidrosocial de la cuenca del río Usumacinta",
     "Estudio Hidrosocial de la Cuenca del Río Usumacinta"),
    ("plan-gestion-usumacinta", "Plan de gestión integrada de la cuenca del río Usumacinta",
     "PLAN DE GESTIÓN INTEGRADA DE LA CUENCA DEL RÍO USUMACINTA"),
]

CSS = """
@page { size: A4; margin: 18mm 16mm 20mm; }
body { font-family: "Helvetica Neue", Arial, "Apple Color Emoji", sans-serif;
       font-size: 10.5pt; line-height: 1.45; color: #1c1917; }
.encabezado { border-bottom: 2px solid #1E4D8C; padding-bottom: 6px; margin-bottom: 18px;
              font-size: 8.5pt; color: #57534e; display: flex; justify-content: space-between; }
.encabezado strong { color: #1E4D8C; letter-spacing: .04em; text-transform: uppercase; }
h1, h2, h3, h4 { color: #1E4D8C; line-height: 1.25; break-after: avoid; }
h1 { font-size: 17pt; } h2 { font-size: 13.5pt; } h3 { font-size: 11.5pt; }
p, li { orphans: 3; widows: 3; }
table { border-collapse: collapse; width: 100%; margin: 10px 0 14px; font-size: 9pt;
        break-inside: auto; }
tr { break-inside: avoid; }
/* pandoc copia el centrado de Google Docs en línea; el texto tabular se lee mejor a la izquierda */
th, td { border: 1px solid #d6d3d1; padding: 4px 6px; vertical-align: top; text-align: left !important; }
th, thead td { background: #eef2f8; }
tbody tr:nth-child(even) td { background: #fafaf9; }
blockquote { border-left: 3px solid #E8C547; margin: 8px 0; padding: 2px 10px; color: #44403c; }
img { max-width: 100%; }
"""


def fuente(prefijo: str) -> Path:
    # macOS guarda los nombres con acentos descompuestos (NFD): se comparan en NFC.
    nfc = lambda s: unicodedata.normalize("NFC", s)
    hits = [p for p in SRC.glob("*.docx") if nfc(p.name).startswith(nfc(prefijo))]
    if len(hits) != 1:
        sys.exit(f"Esperaba un documento que empiece por {prefijo!r} en {SRC}, hay {len(hits)}")
    return hits[0]


def limpiar_docx(docx: Path, destino: Path) -> Path:
    """Copia del .docx que pandoc pueda leer.

    Los documentos se exportaron desde Google Docs, que marca cada fila con
    <w:tblHeader w:val="0"/> ("no es encabezado") y escribe anchos de columna con
    decimales dentro de un <w:tblGridChange>. Con eso pandoc vacía las tablas: las
    filas o las celdas salen en blanco. Quitar la marca y redondear los anchos no
    cambia el contenido.
    """
    with zipfile.ZipFile(docx) as zi, zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as zo:
        for item in zi.infolist():
            datos = zi.read(item.filename)
            if item.filename == "word/document.xml":
                datos = re.sub(rb'<w:tblHeader w:val="(?:0|false)"/>', b"", datos)
                datos = re.sub(rb"<w:tblGridChange\b.*?</w:tblGridChange>", b"", datos, flags=re.S)
                datos = re.sub(rb'w:w="(\d+)\.\d+"', rb'w:w="\1"', datos)
            zo.writestr(item, datos)
    return destino


def construir(n: int, slug: str, titulo: str, docx: Path, tmp: Path) -> Path:
    limpio = limpiar_docx(docx, tmp / f"{slug}.docx")
    cuerpo = subprocess.run(
        ["pandoc", str(limpio), "--from=docx", "--to=html5", "--wrap=none"],
        check=True, capture_output=True, text=True,
    ).stdout
    # Algunos párrafos traen negritas de Markdown pegadas como texto ("**Población:**").
    cuerpo = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", cuerpo)
    pagina = tmp / f"{slug}.html"
    pagina.write_text(
        f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>{html.escape(titulo)}</title><style>{CSS}</style></head><body>
<div class="encabezado"><strong>Guatemala Datos Básicos 2026</strong><span>Anexo {n}</span></div>
{cuerpo}
</body></html>""",
        encoding="utf-8",
    )
    pdf = OUT / f"{slug}.pdf"
    subprocess.run(
        [CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
         f"--print-to-pdf={pdf}", pagina.as_uri()],
        check=True, capture_output=True,
    )
    return pdf


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as t:
        for n, (slug, titulo, prefijo) in enumerate(ANEXOS, start=1):
            pdf = construir(n, slug, titulo, fuente(prefijo), Path(t))
            print(f"  Anexo {n}: {pdf.relative_to(ROOT)}  ({pdf.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
