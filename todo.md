# Municipios feature — TODO

Branch: `municipios`. Per-municipio map view where clicking a municipio shows its
indicators like a departamento.

## Done
- [x] Extract municipio data from `/docs/*.docx` → `backend/app/seed/data/municipios.json`
      (333/340 municipios, 98%, values validated & out-of-range parses nulled).
      Regenerate: `python3 backend/app/seed/extract_municipios.py`
- [x] Backend JSON-backed endpoint: `GET /api/v1/municipios` (+ `?departamento=`) and `/{slug}`
      (`/{slug}?departamento=` desambigua los 6 slugs repetidos).
- [x] Frontend per-municipio selection: `municipioActivo` state, `useMunicipio`, `PanelMunicipio`,
      `MapaMunicipios` onClick selects the municipio (not the department).
- [x] Frontend typecheck (`tsc -b`) clean.
- [x] Recolor municipios map as a variable choropleth (same ramp as departments);
      gray for municipios missing data for the active variable.
- [x] Municipio ficha at `/ficha/:departamento_slug/:municipio_slug` (dept ficha moved to
      `/ficha/:departamento_slug`). Reuses `KpiCard` + generic `RegionShape`; comparison
      chart is municipio vs. parent department. Linked from the municipio panel.
- [x] Navigation: `/ficha` lists all departments; department ficha now drills down to its
      municipios at the bottom (+ keeps other-departments nav); breadcrumb trail
      (Fichas › Departamento › Municipio) on both fichas.
- [x] Tabla page: Departamentos/Municipios toggle (like the map). Municipios mode =
      333 rows, single snapshot, row→municipio ficha, search + Excel.
- [x] Fill the department gaps for 2005 and 2025 from the newer thematic docs
      (`enrich_departamentos.py`): PEA / ocupados / desocupados / ingreso medio,
      mortalidad materna, tiempo de duplicación, nupcialidad (matrimonios, edad de
      primera unión, uniones de hecho) e IDH 1994. Migración `a7d3e91b2c45`.
- [x] Fill the municipio gaps: los 17 municipios del departamento de Guatemala y
      PEA/PEI del Censo 2018 (272 → 333 municipios).
- [x] Tabla y ficha ocultan los indicadores sin ningún dato en los años elegidos,
      en vez de dibujar columnas/tarjetas llenas de guiones.
- [x] Densidad (población/extensión) y tiempo de duplicación (70/tasa) se calculan en
      vez de copiarse: `backend/app/seed/derivados.py` al generar los JSON y
      `frontend/src/lib/derivados.ts` sobre lo que llega por API, así que valen en
      tabla, mapa, ficha, gráficas, panel y exportación. El total nacional usa las
      mismas fórmulas en lugar de promediar densidades.

- [x] Corte de 1994 regenerado desde su fuente (`GUATEMALA DATOS BASICOS 1994.docx`):
      mortalidad general y materna, PEA/ocupada/desocupada, ingreso medio, agua y
      saneamiento (el libro los publica en personas; se convierten a %). Verificado
      indicador por indicador contra el documento.
- [x] IDH 1994 con sus tres componentes (salud, educación e ingresos) para los 22
      departamentos, del documento de IDH 1994.
- [x] Participación electoral (padrón, votos emitidos, abstencionismo y participación,
      Elecciones Generales 2023 primera vuelta) para los 22 departamentos y 328
      municipios, del documento de votantes. Migración `b8e5c02f7d19`.
- [x] Cobertura de municipios: 339 de 340 (solo falta San José La Máquina).
- [x] Extensión territorial corregida con el libro de 1994: Guatemala 2,253 → 2,126,
      Chimaltenango 1,179 → 1,979 y San Marcos 3,792 → 3,791 km². Las 22 ahora suman
      exactamente los 108,889 km² oficiales del país (antes 108,217).

## Pending
- [ ] `mortalidad_general` sigue vacía en 2005 y 2025. Se buscó en los 40 .docx/.pdf de
      `/docs` y en las 65 infografías (OCR): solo aparece en el libro de 1994 (por
      departamento, ya cargada) y como dato nacional 2025 (~4.9–5.3 ‰). Hace falta una
      fuente MSPAS/INE por departamento.
- [ ] `analfabetismo_pct` de 1994: el libro de 1994 no trae ningún indicador educativo
      y ningún otro documento lo cubre para ese año. El doc de IDH 1994 sí trae un
      subíndice de educación, pero no es convertible a tasa de analfabetismo.
- [ ] Quetzaltenango 1994 no tiene población: el libro omite esa línea (solo imprime
      1991 = 473,800 y 2000 = 609,590), así que tampoco tiene densidad ni % de agua y
      saneamiento. No se interpoló porque las cifras de 1994 del libro no son
      consistentes con sus propias series 1991-2000. El censo de 1994 da ~503,900.
- [ ] 1 municipio sin ningún dato: San José La Máquina (Suchitepéquez), que no aparece
      en ningún documento.
- [ ] El padrón de los municipios no cuadra con el del departamento en 7 casos
      (Retalhuleu -26 %, Suchitepéquez, Quetzaltenango, San Marcos, Quiché, Petén,
      Sololá): el documento de votantes omite municipios o los da como aproximados
      ("~11,430", "18, approx."), y esos valores no se cargan. Las filas de Petén
      además suman 2.8 % más que su propio total y omiten Sayaxché.
- [ ] El GeoJSON ubica Chicamán en Alta Verapaz y San Felipe en Quetzaltenango
      (pertenecen a Quiché y Retalhuleu). El dato conserva el departamento correcto y
      la forma se localiza por nombre; conviene corregir el GeoJSON.
- [ ] 6 slugs de municipio se repiten entre departamentos (La Democracia, San José,
      San Pedro Sacatepéquez, La Libertad, Santa Bárbara, San Lorenzo). Mapa, panel,
      ficha y Excel ya los distinguen por departamento; queda la `key` de React en la
      tabla, que sigue siendo el slug a secas.
- [ ] Vintages mezclados en municipios: la población es proyección 2025 salvo en Alta y
      Baja Verapaz, donde el único dato disponible es el Censo 2018. Convendría marcarlo
      en la UI.
- [ ] Revisar valores heredados sospechosos del parser de prosa (p. ej. San José Pinula
      con `analfabetismo_pct` 91.4, que parece ser la tasa de alfabetismo).
- [ ] 58 municipios siguen sin densidad porque no hay extensión territorial en ningún
      documento (23 de ellos sí tienen población). Las áreas calculadas desde el
      GeoJSON dan el total del país con 0.4 % de error, pero por municipio se desvían
      bastante (San Benito 547 km² vs 112 reales), así que no se usaron como fuente.
- [ ] 18 densidades departamentales publicadas (casi todas de 1994) difieren entre 5 %
      y 35 % de población/superficie sin llegar al 1.5x que dispara la corrección
      automática. Para forzar el recálculo completo basta poner `TOLERANCIA = 0` en
      `backend/app/seed/derivados.py` y `frontend/src/lib/derivados.ts`.
- [ ] Decide: commit the `/docs/*.docx` source files or add them to `.gitignore`.
- [ ] Visual QA of the map + panel in the running app.
- [ ] Commit the feature.

- [ ] Varios municipios traen su IDH municipal en la prosa (Mixco 0.792, Villa Nueva
      0.765, Chuarrancho ~0.45-0.605…), pero casi siempre como rango. Se podrían
      extraer los que dan un valor único.

## Datos nuevos aún sin usar
- `Proyecciones Demográficas por Departamento en Guatemala.pdf`: población proyectada
  2030 / 2040 / 2050 por departamento. Encaja como cortes futuros del selector de años.
- `TASA GLOBAL DE FECUNDIDAD Y MATROMONIOS. 130826.docx`: matrimonios registrados
  2021-2025 por año (nacional) y la matriz de correlaciones.
- Documento de votantes: las tablas de **segunda vuelta** (20 ago 2023) están cargadas
  en el documento pero no en la base; hoy solo se guarda la primera vuelta.
- `docs/INFOGRAFÍAS GUATEMALA DATOS BÁSICOS/`: 65 imágenes sin catalogar.
