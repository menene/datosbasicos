# Municipios y datos — TODO

Rama: `municipios`. Vista por municipio en el mapa (clic en un municipio muestra sus
indicadores, igual que un departamento) más la carga completa de indicadores
departamentales desde los documentos de `/docs`.

---

## Despliegue

Después de `git pull` en el servidor, en este orden:

```bash
docker compose exec backend alembic upgrade head      # 1. dos migraciones nuevas
docker compose exec backend python -m app.seed.seed   # 2. recargar departamentos
docker compose restart backend                        # 3. asegurar el reinicio
```

Por qué cada paso:

1. **Migraciones.** Este cambio agrega 11 columnas a `indicador`, en dos revisiones:
   `a7d3e91b2c45` (nupcialidad + `idh`) y `b8e5c02f7d19` (componentes del IDH +
   participación electoral). Corre esto **inmediatamente después del pull**: el backend
   arranca con `--reload`, así que se reinicia solo al cambiar los `.py` y consultará
   columnas que todavía no existen. Entre el pull y la migración la API responde 500.
2. **Seed.** `departamentos.json` cambió en casi todos sus valores (corte de 1994
   regenerado, tres superficies corregidas, columnas nuevas). El seed hace upsert por
   `(departamento, año)`, así que es seguro repetirlo y no borra nada.
3. **Reinicio.** Formalmente opcional —`--reload` ya reinicia al ver los `.py` nuevos, y
   `municipios.json` se recarga solo porque la caché lleva la fecha del archivo en la
   llave—, pero deja el estado sin ambigüedad.

Lo que **no** hace falta:

- `docker compose build`: no cambiaron `requirements.txt`, `package.json` ni los
  Dockerfiles.
- `npm install`: no hay dependencias nuevas.
- Tocar `.env` ni `docker-compose.yml`: no hay variables de entorno nuevas.
- Nada para los municipios: no pasan por la base de datos, se sirven desde
  `backend/app/seed/data/municipios.json`.

Comprobación después del despliegue:

```bash
# 22 departamentos con padrón electoral
curl -s 'https://TUDOMINIO/api/v1/departamentos?anio=2025' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(sum(1 for x in d if x['indicadores']['padron_electoral']), 'de', len(d))"

# 340 municipios
curl -s https://TUDOMINIO/api/v1/municipios \
  | python3 -c "import sys,json; print(len(json.load(sys.stdin)))"
```

---

## Hecho

### Vista de municipios
- [x] Extracción de `/docs/*.docx` → `backend/app/seed/data/municipios.json`.
      El archivo trae **los 340 municipios**, 339 con datos: todo municipio del GeoJSON
      aparece aunque ninguna fuente lo mencione, para que ningún listado se lo salte.
      El conteo por departamento coincide con el oficial en los 22.
      Regenerar: `python3 backend/app/seed/extract_municipios.py`
- [x] Endpoint servido desde JSON: `GET /api/v1/municipios` (+ `?departamento=`) y
      `/{slug}` (con `?departamento=` para desambiguar los 6 slugs repetidos). La caché
      lleva la fecha del archivo en la llave, así que un despliegue que solo cambia el
      JSON no necesita reinicio.
- [x] Selección por municipio en el mapa: `municipioActivo` + `municipioDeptActivo`,
      `useMunicipio`, `PanelMunicipio`, `MapaMunicipios`.
- [x] Choropleth por variable en el mapa de municipios (misma rampa que departamentos;
      gris para los que no tienen dato de la variable activa).
- [x] Ficha de municipio en `/ficha/:departamento_slug/:municipio_slug`, con
      comparación municipio vs. su departamento y migas de pan.
- [x] Navegación: `/ficha` lista departamentos, cada ficha departamental baja a sus
      municipios.
- [x] Tabla con interruptor Departamentos / Municipios, búsqueda y exportación a Excel.
- [x] Tabla y ficha ocultan los indicadores que no tienen ni un dato en los años
      elegidos, en vez de dibujar columnas y tarjetas llenas de guiones.

### Datos de departamentos (`enrich_departamentos.py`)
- [x] Corte de 1994 regenerado desde su fuente (`GUATEMALA DATOS BASICOS 1994.docx`):
      mortalidad general y materna, PEA / ocupada / desocupada, ingreso medio, agua y
      saneamiento (el libro los publica en personas, se convierten a %). Verificado
      indicador por indicador contra el documento.
- [x] 2005 y 2025: PEA, ocupados, desocupados e ingreso medio anual; mortalidad
      materna; tiempo de duplicación de 2005.
- [x] Nupcialidad 2021-2025: matrimonios por 1000 hab., edad de primera unión y % de
      uniones de hecho. Migración `a7d3e91b2c45`.
- [x] IDH 1994 con sus tres componentes (salud, educación, ingresos) para los 22
      departamentos.
- [x] Participación electoral (padrón, votos emitidos, abstencionismo, participación)
      de las Elecciones Generales 2023, primera vuelta, para los 22 departamentos y
      328 municipios. Migración `b8e5c02f7d19`. Colgada del corte de 2025 y etiquetada
      "(2023)" en la interfaz.
- [x] Extensión territorial corregida con el libro de 1994: Guatemala 2,253 → 2,126,
      Chimaltenango 1,179 → 1,979 y San Marcos 3,792 → 3,791 km². Las 22 ahora suman
      exactamente los 108,889 km² oficiales del país (antes 108,217).

### Indicadores derivados
- [x] Densidad (población / extensión) y tiempo de duplicación (70 / tasa) se calculan
      en vez de copiarse: `backend/app/seed/derivados.py` al generar los JSON y
      `frontend/src/lib/derivados.ts` sobre lo que llega por API, así que valen en
      tabla, mapa, ficha, gráficas, panel y exportación.
- [x] El total nacional usa las fórmulas en lugar de promediar: densidad = población
      sumada / superficie sumada (promediar las 22 daba 318 hab/km² cuando la real
      ronda 165) y participación = votos / padrón.

- [x] Revisión del 19/08 sobre municipios faltantes en la ficha: resueltos los 22
      departamentos. El conteo por departamento coincide con la división oficial, y
      Alta Verapaz usa **17 municipios** (incluye Santa Catalina La Tinta, 1999, y
      Raxruhá, 2008), decisión del autor.
- [x] Distribución por sexo de 2005 corregida a 49 % hombres / 51 % mujeres en los 12
      departamentos que el documento imprimía como 50/50 mientras su propia línea decía
      "ligera mayoría femenina" (uno decía "50% hombres y 50% hombres"). Los 7 con
      mayoría masculina que el documento sí afirma —El Progreso, Santa Rosa, Petén e
      Izabal 51/49, Chiquimula 52/48, Escuintla 50.5/49.5, Retalhuleu 49.7/50.3— se
      dejaron como están, decisión del autor.
- [x] Distancia por carretera de cada cabecera a la capital actualizada con los valores
      oficiales de Digi-USAC: corrige 16 de las 22 (los anteriores venían del libro de
      1994, con la red vial de hace treinta años — Petén 507 → 480, Zacapa 156 → 195,
      Jutiapa 124 → 105). Está en `DISTANCIA_CAPITAL_KM` en el script. Se muestra en la
      ficha departamental, en el panel del mapa y ahora también como columna ordenable
      de la tabla, incluida en la exportación a Excel.
- [x] Acceso a agua y saneamiento de 1994: se conservan los valores del libro (60 % y
      57 %), pero mapa, tabla y ficha advierten que son una estimación nacional
      aplicada por igual a los 22 departamentos, no una medición departamental
      (`notaIndicador` en `types/departamento.ts`).

### Comprobaciones cruzadas que corren con los scripts
- [x] Las 22 extensiones territoriales suman 108,889 km² exactos.
- [x] El padrón de los municipios suma el del departamento en 15 de 22 casos; el script
      imprime el descuadre de los otros 7.
- [x] Los 22 padrones departamentales suman 9,270,360 contra los ~9,361,000 del padrón
      nacional 2023 (la diferencia es el voto en el exterior) y la participación
      agregada da 59.97 %, el dato oficial.

---

## Pendiente

### Huecos que vienen de las fuentes
- [ ] `mortalidad_general` en 2005 y 2025. Se buscó en los 40 .docx/.pdf de `/docs` y en
      las 65 infografías (OCR): solo aparece en el libro de 1994 (por departamento, ya
      cargada) y como dato nacional 2025 (~4.9–5.3 ‰). Hace falta una fuente MSPAS/INE
      por departamento.
- [ ] `analfabetismo_pct` de 1994: el libro de ese año no trae ningún indicador
      educativo. El documento de IDH 1994 sí tiene un subíndice de educación, pero
      mezcla alfabetización y matriculación, así que no es convertible a tasa.
- [ ] Quetzaltenango 1994 no tiene población: el libro omite esa línea (solo imprime
      1991 = 473,800 y 2000 = 609,590), así que tampoco tiene densidad ni % de agua y
      saneamiento. No se interpoló porque las cifras de 1994 del libro no son
      consistentes con sus propias series 1991-2000. El censo de 1994 da ~503,900.
- [ ] San José La Máquina (Suchitepéquez) es el único municipio sin ningún dato: no
      aparece en ningún documento (se creó en 2014, posterior a la mayoría de las
      fuentes). Ya figura en los listados con las cifras en blanco.

- [ ] El padrón de los municipios no cuadra con el del departamento en 7 casos
      (Retalhuleu −26 %, Suchitepéquez, Quetzaltenango, San Marcos, Quiché, Petén,
      Sololá): el documento de votantes omite municipios o los da aproximados
      ("~11,430", "18, approx.") y esos valores no se cargan a propósito, porque un
      padrón es un registro exacto. Las filas de Petén además suman 2.8 % más que su
      propio total y omiten Sayaxché.
- [ ] 58 municipios sin densidad porque no hay extensión territorial en ningún
      documento (23 de ellos sí tienen población). Las áreas calculadas desde el
      GeoJSON dan el total del país con 0.4 % de error, pero por municipio se desvían
      bastante (San Benito 547 km² contra 112 reales), así que no se usaron.

### Calidad de datos
- [ ] 18 densidades departamentales publicadas (casi todas de 1994) difieren entre 5 % y
      35 % de población/superficie sin llegar al 1.5x que dispara la corrección
      automática. Para forzar el recálculo completo, `TOLERANCIA = 0` en
      `backend/app/seed/derivados.py` y `frontend/src/lib/derivados.ts`.
- [ ] Valores heredados sospechosos del parser de prosa, p. ej. San José Pinula con
      `analfabetismo_pct` 91.4, que parece ser la tasa de alfabetismo.
- [ ] Vintages mezclados en municipios: la población es proyección 2025 salvo en Alta y
      Baja Verapaz, donde el único dato disponible es el Censo 2018. Convendría
      marcarlo en la interfaz.
- [ ] El GeoJSON ubica Chicamán en Alta Verapaz y San Felipe en Quetzaltenango
      (pertenecen a Quiché y Retalhuleu). El dato conserva el departamento correcto y
      la forma se localiza por nombre; conviene corregir el GeoJSON.

### Código
- [ ] La distancia a la capital es a la **cabecera** (Cobán, Salamá, Guastatoya, Puerto
      Barrios, Flores, Santa Cruz del Quiché, Antigua Guatemala, Cuilapa, Mazatenango…),
      pero el nombre de la cabecera no se guarda en ningún lado. Agregar un campo
      `cabecera` al departamento daría contexto al número (necesita migración).
- [ ] 6 slugs de municipio se repiten entre departamentos (La Democracia, San José,
      San Pedro Sacatepéquez, La Libertad, Santa Bárbara, San Lorenzo). Mapa, panel,
      ficha y Excel ya los distinguen por departamento; queda la `key` de React en la
      tabla, que sigue siendo el slug a secas.
- [ ] QA visual del mapa y el panel en la aplicación corriendo.
- [ ] Decidir si los `/docs/*.docx` se commitean o se agregan a `.gitignore`.

---

## Datos disponibles aún sin cargar
- `Proyecciones Demográficas por Departamento en Guatemala.pdf`: población proyectada
  2030 / 2040 / 2050 por departamento. Encaja como cortes futuros del selector de años.
- Documento de votantes: las tablas de **segunda vuelta** (20 ago 2023) están en el
  documento pero no en la base; hoy solo se guarda la primera vuelta.
- `TASA GLOBAL DE FECUNDIDAD Y MATROMONIOS. 130826.docx`: matrimonios registrados
  2021-2025 por año (nacional) y la matriz de correlaciones.
- Varios municipios traen su IDH municipal en la prosa (Mixco 0.792, Villa Nueva 0.765,
  Chuarrancho ~0.45-0.605…), pero casi siempre como rango; se podrían extraer los que
  dan un valor único.
- `docs/INFOGRAFÍAS GUATEMALA DATOS BÁSICOS/`: 65 imágenes sin catalogar. **Ojo**: las
  tres que traen tablas departamentales (IMG_8460, IMG_8461, IMG_8371) están generadas
  con IA y tienen valores alucinados (porcentajes de 192 %, departamentos repetidos,
  Sololá con 20.92 millones de habitantes). No sirven como fuente.
