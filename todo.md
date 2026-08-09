# Municipios feature — TODO

Branch: `municipios`. Per-municipio map view where clicking a municipio shows its
indicators like a departamento.

## Done
- [x] Extract municipio data from `/docs/*.docx` → `backend/app/seed/data/municipios.json`
      (272/340 municipios, ~80%, values validated & out-of-range parses nulled).
      Regenerate: `python3 backend/app/seed/extract_municipios.py`
- [x] Backend JSON-backed endpoint: `GET /api/v1/municipios` (+ `?departamento=`) and `/{slug}`.
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
      272 rows, single snapshot, 13 available columns, row→municipio ficha, search + Excel.

## Pending
- [ ] Fill the data gaps (68 municipios): Alta Verapaz + Baja Verapaz prose/range docs,
      Guatemala-dept separate format, scattered cabeceras (e.g. Cobán).
- [ ] Decide: commit the `/docs/*.docx` source files or add them to `.gitignore`.
- [ ] Visual QA of the map + panel in the running app.
- [ ] Commit the feature.
