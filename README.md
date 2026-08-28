# Guatemala Datos Básicos 2026 — Plataforma Interactiva

Plataforma web de análisis e investigación sobre los 22 departamentos de Guatemala. Combina un mapa choropleth interactivo, gráficas comparativas, tablas de datos y fichas por departamento, todo alimentado por una API REST y una base de datos relacional.

---

## Tabla de contenidos

1. [Visión general](#visión-general)
2. [Stack tecnológico](#stack-tecnológico)
3. [Arquitectura del proyecto](#arquitectura-del-proyecto)
4. [Estructura de directorios](#estructura-de-directorios)
5. [Base de datos](#base-de-datos)
6. [API — FastAPI](#api--fastapi)
7. [Frontend — React + shadcn/ui](#frontend--react--shadcnui)
8. [Guía de diseño frontend (frontend-design skill)](#guía-de-diseño-frontend-frontend-design-skill)
9. [Docker y Docker Compose](#docker-y-docker-compose)
10. [Variables de entorno](#variables-de-entorno)
11. [Comandos de desarrollo](#comandos-de-desarrollo)
12. [Datos iniciales (seed)](#datos-iniciales-seed)
13. [Despliegue](#despliegue)
14. [Analítica (Umami)](#analítica-umami)
15. [Convenciones de código](#convenciones-de-código)

---

## Visión general

La plataforma presenta indicadores demográficos, socioeconómicos y de salud de los 22 departamentos de Guatemala (proyecciones 2025–2026), con cuatro vistas principales:

| Vista | Descripción |
|---|---|
| **Mapa** | Choropleth SVG/D3 coloreado por variable activa; clic abre panel lateral |
| **Gráficas** | Barras comparativas y radar de comparación entre departamentos |
| **Tabla** | Todos los indicadores con filtros, ordenamiento y exportación CSV |
| **Ficha** | Tarjeta detallada por departamento con KPIs y descripción narrativa |

---

## Stack tecnológico

### Backend

| Capa | Tecnología | Versión |
|---|---|---|
| API REST | **FastAPI** | ≥ 0.111 |
| ORM | **SQLAlchemy** (async) | ≥ 2.0 |
| Migraciones | **Alembic** | ≥ 1.13 |
| Validación | **Pydantic v2** | ≥ 2.7 |
| Base de datos | **PostgreSQL** | 16 |
| Driver async | **asyncpg** | ≥ 0.29 |
| Servidor ASGI | **Uvicorn** | ≥ 0.30 |
| CORS | FastAPI middleware | — |

### Frontend

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **React 18** + **Vite 5** | TypeScript estricto |
| UI Components | **shadcn/ui** | Basado en Radix UI + Tailwind |
| Estilos | **Tailwind CSS v3** | Config personalizada |
| Mapa | **D3.js v7** | Choropleth + GeoJSON departamentos |
| Gráficas | **Recharts** | Barras, radar, pie |
| Tabla | **TanStack Table v8** | Filtros, ordenamiento, paginación |
| Estado global | **Zustand** | Store para filtros y departamento activo |
| Peticiones | **TanStack Query v5** | Cache y sincronización con la API |
| Animaciones | **Motion (Framer Motion)** | Micro-interacciones y transiciones |
| Íconos | **Lucide React** | Consistencia con shadcn |
| Tipografía | **Geist** (display) + **IBM Plex Sans** (cuerpo) | Ver sección de diseño |

### Infraestructura

| Herramienta | Uso |
|---|---|
| **Docker** | Contenedores para cada servicio |
| **Docker Compose** | Orquestación local (dev y prod) |
| **pgAdmin** | Gestión visual de PostgreSQL (solo dev) |

---

## Arquitectura del proyecto

```
┌─────────────────────────────────────────────────┐
│                  Navegador                      │
│  React + Vite + shadcn/ui + D3 + Recharts       │
└───────────────────┬─────────────────────────────┘
                    │ HTTP / REST (JSON)
┌───────────────────▼─────────────────────────────┐
│              FastAPI (puerto 8000)               │
│  Routers: /departamentos  /indicadores  /geo     │
└───────────────────┬─────────────────────────────┘
                    │ SQLAlchemy async
┌───────────────────▼─────────────────────────────┐
│           PostgreSQL 16 (puerto 5432)            │
│  Tablas: departamento · indicador · region       │
└─────────────────────────────────────────────────┘
```

Todos los servicios corren en la misma red Docker `guatemala_net`.

---

## Estructura de directorios

```
guatemala-datos/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   └── app/
│       ├── main.py               # Punto de entrada FastAPI
│       ├── config.py             # Settings con Pydantic BaseSettings
│       ├── database.py           # Engine async + SessionLocal
│       ├── models/
│       │   ├── departamento.py
│       │   ├── indicador.py
│       │   └── region.py
│       ├── schemas/
│       │   ├── departamento.py
│       │   └── indicador.py
│       ├── routers/
│       │   ├── departamentos.py
│       │   ├── indicadores.py
│       │   └── geo.py            # Endpoint que sirve GeoJSON
│       ├── crud/
│       │   └── departamento.py
│       └── seed/
│           ├── seed.py                    # Carga inicial (upsert) a PostgreSQL
│           ├── derivados.py               # Fórmulas de densidad y duplicación
│           ├── enrich_departamentos.py    # Rellena departamentos.json desde /docs
│           ├── extract_municipios.py      # Genera municipios.json desde /docs
│           └── data/
│               ├── departamentos.json
│               ├── municipios.json
│               ├── guatemala.geojson
│               └── guatemala_municipios.geojson
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── components.json           # Config de shadcn/ui
    ├── public/
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/                  # Funciones de fetch + TanStack Query hooks
        │   ├── departamentos.ts
        │   └── geo.ts
        ├── store/                # Zustand stores
        │   ├── filtros.ts
        │   └── seleccion.ts
        ├── components/
        │   ├── ui/               # Componentes shadcn/ui (auto-generados)
        │   ├── layout/
        │   │   ├── Navbar.tsx
        │   │   └── Sidebar.tsx
        │   ├── mapa/
        │   │   ├── MapaChoropleth.tsx
        │   │   └── MapaTooltip.tsx
        │   ├── graficas/
        │   │   ├── BarrasComparativas.tsx
        │   │   └── RadarComparacion.tsx
        │   ├── tabla/
        │   │   └── TablaDepartamentos.tsx
        │   └── ficha/
        │       └── FichaDepartamento.tsx
        ├── pages/
        │   ├── Mapa.tsx
        │   ├── Graficas.tsx
        │   ├── Tabla.tsx
        │   └── Ficha.tsx
        ├── types/
        │   └── departamento.ts
        └── lib/
            ├── utils.ts          # cn() y helpers
            ├── colores.ts        # Escalas D3 para el choropleth
            └── analytics.ts      # Wrapper tipado sobre Umami
```

---

## Base de datos

### Modelo relacional

```sql
-- Regiones geográficas de Guatemala
CREATE TABLE region (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL UNIQUE,  -- e.g. "noroccidente", "metropolitana"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22 departamentos
CREATE TABLE departamento (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(60)  NOT NULL UNIQUE,  -- e.g. "quetzaltenango"
  nombre          VARCHAR(100) NOT NULL,
  region_id       INTEGER REFERENCES region(id),
  superficie_km2  NUMERIC(10,2),
  descripcion     TEXT,                          -- Texto narrativo del documento
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indicadores numéricos (un row por depto + indicador + año)
CREATE TABLE indicador (
  id                   SERIAL PRIMARY KEY,
  departamento_id      INTEGER NOT NULL REFERENCES departamento(id),
  anio                 SMALLINT NOT NULL DEFAULT 2025,

  -- Población
  poblacion_total      INTEGER,
  poblacion_2005       INTEGER,
  densidad_hab_km2     NUMERIC(8,2),
  pct_hombres          NUMERIC(5,2),
  pct_mujeres          NUMERIC(5,2),
  pct_urbana           NUMERIC(5,2),
  pct_rural            NUMERIC(5,2),
  pct_indigena         NUMERIC(5,2),

  -- Salud
  esperanza_vida       NUMERIC(4,1),
  analfabetismo_pct    NUMERIC(5,2),
  acceso_agua_pct      NUMERIC(5,2),
  acceso_saneamiento_pct NUMERIC(5,2),

  -- Familia
  fecundidad           NUMERIC(4,2),
  crecimiento_anual_pct NUMERIC(4,2),

  -- Desarrollo
  idh_ranking          SMALLINT,

  created_at           TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (departamento_id, anio)
);

CREATE INDEX idx_indicador_depto ON indicador(departamento_id);
CREATE INDEX idx_indicador_anio  ON indicador(anio);
```

### Migraciones con Alembic

```bash
# Crear nueva migración
docker compose exec backend alembic revision --autogenerate -m "descripción"

# Aplicar migraciones
docker compose exec backend alembic upgrade head

# Revertir última migración
docker compose exec backend alembic downgrade -1
```

---

## API — FastAPI

### Endpoints principales

```
GET  /api/v1/departamentos          Lista todos los departamentos con indicadores
GET  /api/v1/departamentos/{slug}   Detalle de un departamento
GET  /api/v1/indicadores/resumen    Estadísticas globales (min, max, promedio)
GET  /api/v1/geo/departamentos      GeoJSON de los 22 departamentos
GET  /api/v1/health                 Health check
```

### Query params disponibles en `/departamentos`

| Param | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `region` | string | `noroccidente` | Filtrar por región |
| `orden` | string | `poblacion_total` | Campo de ordenamiento |
| `dir` | string | `desc` | Dirección: `asc` o `desc` |
| `anio` | int | `2025` | Año del indicador |

### Esquema de respuesta (ejemplo)

```json
{
  "id": 1,
  "slug": "quetzaltenango",
  "nombre": "Quetzaltenango",
  "region": "suroccidente",
  "superficie_km2": 1951.0,
  "descripcion": "La capital del occidente...",
  "indicadores": {
    "anio": 2025,
    "poblacion_total": 965000,
    "densidad_hab_km2": 494.6,
    "pct_urbana": 65.0,
    "pct_indigena": 65.0,
    "esperanza_vida": 75.0,
    "analfabetismo_pct": 6.5,
    "acceso_agua_pct": 92.5,
    "fecundidad": 2.25,
    "crecimiento_anual_pct": 1.8,
    "idh_ranking": 3
  }
}
```

### Documentación automática

FastAPI genera documentación interactiva en:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## Frontend — React + shadcn/ui

### Instalación de shadcn/ui

El proyecto usa shadcn/ui con el preset `default`. Componentes a instalar al inicio:

```bash
npx shadcn@latest init
npx shadcn@latest add button card badge select sheet tabs tooltip
npx shadcn@latest add table skeleton separator scroll-area
npx shadcn@latest add dropdown-menu command dialog
```

### Componentes shadcn clave por módulo

| Módulo | Componentes shadcn |
|---|---|
| Navbar | `Button`, `Sheet` (menú móvil), `Command` (búsqueda) |
| Mapa | `Tooltip`, `Card`, `Badge`, `Select` (variable activa) |
| Gráficas | `Tabs`, `Card`, `Select`, `Skeleton` |
| Tabla | `Table`, `Badge`, `Button`, `DropdownMenu` |
| Ficha | `Card`, `Badge`, `Separator`, `ScrollArea` |
| Global | `Dialog`, `Sheet` (sidebar) |

### Flujo de estado (Zustand)

```ts
// store/seleccion.ts
interface SeleccionStore {
  departamentoActivo: string | null      // slug
  departamentosComparar: string[]        // hasta 2 slugs para radar
  setDepartamentoActivo: (slug: string) => void
  toggleComparar: (slug: string) => void
}

// store/filtros.ts
interface FiltrosStore {
  variableActiva: keyof Indicadores      // campo a visualizar en mapa/barras
  region: string | null
  busqueda: string
  setVariable: (v: keyof Indicadores) => void
  setRegion: (r: string | null) => void
  setBusqueda: (b: string) => void
}
```

### Variables disponibles para el mapa/barras

```ts
export const VARIABLES = [
  { key: "poblacion_total",       label: "Población total",       formato: "numero" },
  { key: "densidad_hab_km2",      label: "Densidad (hab/km²)",    formato: "decimal" },
  { key: "pct_urbana",            label: "Población urbana (%)",  formato: "porcentaje" },
  { key: "pct_indigena",          label: "Población indígena (%)",formato: "porcentaje" },
  { key: "esperanza_vida",        label: "Esperanza de vida",     formato: "decimal" },
  { key: "analfabetismo_pct",     label: "Analfabetismo (%)",     formato: "porcentaje" },
  { key: "acceso_agua_pct",       label: "Acceso agua (%)",       formato: "porcentaje" },
  { key: "fecundidad",            label: "Tasa de fecundidad",    formato: "decimal" },
  { key: "crecimiento_anual_pct", label: "Crecimiento anual (%)", formato: "porcentaje" },
] as const;
```

---

## Guía de diseño frontend (frontend-design skill)

> **Este proyecto usa el skill `frontend-design` de Claude.** Todo componente, página o layout debe seguir estas directrices antes de escribir código.

### Dirección estética

**Editorial / cartográfica refinada** — inspirada en atlas modernos y dashboards de periodismo de datos (estilo The Economist, National Geographic data viz). Evitar estéticas genéricas de dashboard corporativo.

### Principios

1. **Tipografía con carácter**: usar **Geist** para títulos y números destacados, **IBM Plex Sans** para cuerpo y etiquetas. Nunca Inter, Roboto ni Arial.
2. **Paleta dominante + acento**: base en tonos tierra/jade que evoquen Guatemala — verde selva (`#1B6B3A`), azul lago (`#1E4D8C`), tierra (`#8B4513`) — con blanco/crema de fondo. Un solo acento vibrante (amarillo maíz `#E8C547`) para highlights.
3. **Jerarquía clara**: números grandes y visibles en las fichas de KPI, texto secundario en gris medio, sin ruido visual.
4. **Animaciones con propósito**: usar Motion para:
   - Transición entre vistas (fade + slide suave)
   - Barras del gráfico que crecen al montar el componente
   - Panel lateral que desliza al seleccionar un departamento
5. **Mapa como hero**: el mapa choropleth debe ser el elemento visual dominante en su vista, ocupando ≥ 70% del ancho disponible.
6. **shadcn como sistema base**: personalizar los tokens de shadcn en `tailwind.config.ts` para que hereden la paleta del proyecto — no usar los colores por defecto sin adaptar.
7. **Densidad controlada**: la tabla y las gráficas pueden ser densas en datos, pero con suficiente padding y separación entre filas/barras para respirar.

### Escala de color del choropleth

Usar escala secuencial D3 (`d3.scaleSequential`) con interpolador personalizado que vaya del crema claro al verde oscuro (para variables positivas) o al rojo tierra (para variables de alerta como analfabetismo).

```ts
// lib/colores.ts
import * as d3 from "d3";

export const escalaPositiva = (dominio: [number, number]) =>
  d3.scaleSequential(dominio, d3.interpolateRgb("#F5F0E8", "#1B6B3A"));

export const escalaAlerta = (dominio: [number, number]) =>
  d3.scaleSequential(dominio, d3.interpolateRgb("#F5F0E8", "#8B2500"));
```

---

## Docker y Docker Compose

### `docker-compose.yml` (desarrollo)

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    container_name: guatemala_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - guatemala_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: guatemala_backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      ENVIRONMENT: development
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app          # Hot reload en desarrollo
    depends_on:
      db:
        condition: service_healthy
    networks:
      - guatemala_net
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: guatemala_frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules        # Evitar override de node_modules
    depends_on:
      - backend
    networks:
      - guatemala_net
    command: npm run dev -- --host 0.0.0.0

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: guatemala_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
    ports:
      - "5050:80"
    depends_on:
      - db
    networks:
      - guatemala_net

volumes:
  postgres_data:

networks:
  guatemala_net:
    driver: bridge
```

### `backend/Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

---

## Variables de entorno

Copiar `.env.example` a `.env` antes de iniciar:

```bash
cp .env.example .env
```

### `.env.example`

```env
# PostgreSQL
POSTGRES_DB=guatemala_datos
POSTGRES_USER=guatemala_user
POSTGRES_PASSWORD=change_me_in_production

# pgAdmin (solo desarrollo)
PGADMIN_EMAIL=admin@guatemala.local
PGADMIN_PASSWORD=admin

# Backend
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:8000/api/v1

# Analítica (Umami)
UMAMI_APP_SECRET=change_me_in_production
VITE_UMAMI_URL=http://localhost:3000
VITE_UMAMI_WEBSITE_ID=
```

`VITE_UMAMI_WEBSITE_ID` se obtiene del panel de Umami tras crear el sitio.
Mientras esté vacía el frontend no inyecta el tracker ni envía eventos. Ver
[Analítica (Umami)](#analítica-umami).

---

## Comandos de desarrollo

### Levantar el proyecto completo

```bash
# Primera vez: construir imágenes y levantar
docker compose up --build

# Siguientes veces
docker compose up

# Solo en background
docker compose up -d
```

### Migraciones y seed

```bash
# Aplicar migraciones (después de que el backend esté corriendo)
docker compose exec backend alembic upgrade head

# Cargar datos iniciales
docker compose exec backend python -m app.seed.seed

# Crear la base de Umami (una sola vez; ver "Analítica")
docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB \
  -c "CREATE DATABASE umami;"

# Crear nueva migración (tras modificar modelos)
docker compose exec backend alembic revision --autogenerate -m "nombre_cambio"
```

### Comandos útiles

```bash
# Ver logs de un servicio
docker compose logs -f backend
docker compose logs -f frontend

# Abrir shell en el backend
docker compose exec backend bash

# Abrir psql directo
docker compose exec db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}

# Detener todo
docker compose down

# Detener y eliminar volúmenes (reset total de DB)
docker compose down -v
```

### Accesos en desarrollo

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| pgAdmin | http://localhost:5050 |
| Umami (analítica) | http://localhost:3000 |

---

## Datos iniciales (seed)

El script `backend/app/seed/seed.py` carga:

1. Las 7 regiones geográficas de Guatemala
2. Los 22 departamentos con su descripción narrativa
3. Los indicadores 2025 de cada departamento

Los datos fuente están en `backend/app/seed/data/departamentos.json`, construidos a
partir de los documentos de `/docs`. Los municipios no pasan por la base de datos: se
sirven directamente desde `backend/app/seed/data/municipios.json`.

### Regenerar los datos desde `/docs`

Ambos JSON se derivan de los `.docx` originales con dos scripts idempotentes, que
imprimen un informe de cobertura al terminar:

```bash
# Departamentos: corte de 1994, PEA e ingresos, mortalidad materna, duplicación,
# nupcialidad, IDH 1994 con componentes y participación electoral 2023
python backend/app/seed/enrich_departamentos.py

# Municipios: perfiles por departamento + tabla de Guatemala + PEA/PEI 2018 + votantes 2023
python backend/app/seed/extract_municipios.py

# Cargar el resultado en PostgreSQL (los municipios no lo necesitan)
docker compose exec backend python -m app.seed.seed
```

Cobertura actual: 22/22 departamentos en los tres cortes (1994, 2005, 2025) y 339 de
los 340 municipios. El script imprime los huecos que vienen de la fuente:
`mortalidad_general` solo existe para 1994, `analfabetismo_pct` no existe para 1994 (el
libro de ese año no trae indicadores educativos) y Quetzaltenango 1994 no tiene
población porque el libro omite esa línea.

Dos comprobaciones cruzadas avisan si una carga sale mal, y ambas se imprimen al
correr los scripts:

- Las 22 extensiones territoriales salen del libro de 1994 y suman exactamente los
  108,889 km² oficiales del país.
- El padrón electoral de los municipios suma el del departamento en 15 de 22 casos;
  en los otros 7 el propio documento omite municipios o los da aproximados, y el
  script imprime cuánto falta en cada uno.

Los indicadores electorales son de las Elecciones Generales 2023 (primera vuelta, TSE
procesado por FOCO Guatemala) y cuelgan del corte de 2025, el más cercano; las
etiquetas de la interfaz llevan el año 2023 para que no se confundan.

### Indicadores derivados

Dos indicadores no se copian del documento: se calculan.

```
densidad_hab_km2         = población total / extensión territorial (km²)
tiempo_duplicacion_anios = 70 / tasa de crecimiento anual (%)      ← regla del 70
```

La regla vive en `backend/app/seed/derivados.py` (se aplica al generar los JSON) y en
`frontend/src/lib/derivados.ts` (se aplica a lo que llega por API, de modo que vale en
tabla, mapa, ficha, gráficas, panel y exportación). En ambos lados:

1. Si falta el valor y hay insumos, se calcula.
2. Si el valor publicado contradice a la fórmula por más de 1.5x, gana la fórmula: el
   número venía atado a una población anterior o es una errata del documento.
3. Si faltan los insumos, se conserva lo publicado (58 municipios sin extensión
   territorial y 54 sin tasa de crecimiento siguen sin estos dos indicadores).

El total nacional de la tabla también usa las fórmulas en vez de promediar: la densidad
es población sumada / superficie sumada (promediar las 22 densidades daba 318 hab/km²
en 2025, cuando la real ronda 165) y la duplicación sale de la tasa nacional.

El GeoJSON de los departamentos debe obtenerse de GADM (https://gadm.org) nivel ADM1 para Guatemala y colocarse en `backend/app/seed/data/guatemala.geojson`.

---

## Despliegue

En producción corre el mismo `docker compose` (con los puertos en loopback, detrás de
Caddy) y el código está montado por volumen, así que **desplegar es hacer `git pull` en
el servidor** más lo que la base de datos necesite.

Después del pull, en este orden:

```bash
docker compose exec backend alembic upgrade head      # 1. migraciones pendientes
docker compose exec backend python -m app.seed.seed   # 2. recargar departamentos
docker compose restart backend                        # 3. asegurar el reinicio
```

**El orden importa.** El backend arranca con `--reload`, así que se reinicia solo en
cuanto el pull cambia un `.py`, y si el modelo ya trae columnas que la base todavía no
tiene, la API responde 500. Corre `alembic upgrade head` inmediatamente después del pull
para que esa ventana dure segundos.

El seed hace upsert por `(departamento, año)`: es idempotente, se puede repetir y no
borra nada. Los municipios **no** pasan por la base —se sirven desde
`seed/data/municipios.json`— y su caché lleva la fecha del archivo en la llave, así que
un cambio que solo toque ese JSON surte efecto sin reiniciar nada.

No hace falta `docker compose build` ni `npm install` salvo que hayan cambiado
`requirements.txt`, `package.json` o los Dockerfiles. Recordá que `docker-compose.yml` y
`.env` están en `.gitignore`: si cambia `docker-compose.yml.example`, hay que aplicar la
diferencia a mano en el servidor.

Comprobación después de desplegar:

```bash
# 22 departamentos con padrón electoral
curl -s 'https://TUDOMINIO/api/v1/departamentos?anio=2025' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(sum(1 for x in d if x['indicadores']['padron_electoral']), 'de', len(d))"

# 339 municipios
curl -s https://TUDOMINIO/api/v1/municipios \
  | python3 -c "import sys,json; print(len(json.load(sys.stdin)))"
```

---

## Analítica (Umami)

La plataforma usa [Umami](https://umami.is) autoalojado para medir tráfico y
uso. Es sin cookies y no almacena datos personales, así que **no requiere
banner de consentimiento** — algo relevante en una herramienta de datos
públicos.

El servicio `umami` vive en el `docker-compose.yml` de la raíz y comparte el
Postgres del proyecto usando una base aparte (`umami`), así que no hace falta
levantar nada adicional: `docker compose up` lo incluye.

### Puesta en marcha

La base `umami` hay que crearla una sola vez. Como el volumen de Postgres ya
existe, los scripts de `docker-entrypoint-initdb.d` no se ejecutan:

```bash
docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB \
  -c "CREATE DATABASE umami;"

docker compose up -d umami
docker compose logs -f umami        # esperar "Ready on http://0.0.0.0:3000"
```

El primer arranque corre las migraciones de Prisma (~30–60 s).

Luego, en el panel en http://localhost:3000:

1. Login inicial **`admin` / `umami`** → cambiar la contraseña
2. **Settings → Websites → Add website**
   - Name: `Guatemala Datos Básicos`
   - Domain: `localhost`
3. Copiar el **Website ID** a `VITE_UMAMI_WEBSITE_ID` en el `.env` de la raíz
4. `docker compose restart frontend` para que Vite tome la variable

Para comprobar que funciona: abrir la app, DevTools → Network, filtrar por
`send`. Cada navegación debe producir un `POST /api/send` con respuesta `200`,
y la visita aparece en **Realtime** del panel en segundos.

### En producción

`docker-compose.yml` y `.env` están en `.gitignore` a propósito: cada entorno
tiene los suyos. La referencia versionada es `docker-compose.yml.example`, y
**los cambios hay que aplicarlos a mano en el servidor**.

Dos cosas que no se deducen solas:

**Tener las variables en `.env` no basta.** Compose usa `.env` únicamente para
interpolar `${VAR}` dentro del compose; la variable llega al contenedor solo si
está listada en el bloque `environment:` del servicio. Si `VITE_UMAMI_URL` está
en `.env` pero no bajo `frontend:`, el contenedor nunca la ve y el tracker
queda deshabilitado en silencio.

**`VITE_UMAMI_URL` se resuelve en el navegador del visitante, no en el
servidor.** `http://localhost:3000` apunta a la máquina de quien visita el
sitio. En producción debe ser la URL pública del panel, y **en HTTPS tiene que
ser HTTPS**: un sitio HTTPS no puede cargar un script HTTP, el navegador lo
bloquea por contenido mixto antes de que salga la petición.

Como el panel se publica solo en loopback (`127.0.0.1:${UMAMI_PORT}`), eso
implica un bloque de Caddy:

```
analytics.tudominio.com {
	reverse_proxy 127.0.0.1:3030
}
```

```bash
VITE_UMAMI_URL=https://analytics.tudominio.com
```

Tras cualquier cambio de estas variables hay que **recrear** el contenedor, no
reiniciarlo — Vite lee el entorno al arrancar el proceso:

```bash
docker compose up -d --force-recreate frontend
docker compose exec frontend env | grep VITE_          # deben estar las tres
curl -s https://TUDOMINIO/src/lib/analytics.ts | head -1   # con valores reales
```

El `curl` de la página **no** sirve para verificar: el tracker se inyecta desde
JS en tiempo de ejecución, así que el HTML nunca contiene la palabra `umami`
aunque todo funcione.

### Eventos instrumentados

Las vistas de página se registran solas — el tracker intercepta
`history.pushState`, así que las rutas de React Router funcionan sin código
adicional, y `/ficha/:slug` da el desglose por departamento desde la URL.

| Evento | Se dispara cuando | Propiedades |
|---|---|---|
| `mapa_vista` | Cambio entre pestañas Departamentos / Municipios | `vista` |
| `mapa_departamento_click` | Clic que **selecciona** un departamento | `departamento`, `variable`, `anio` |
| `mapa_municipio_click` | Clic que **selecciona** un municipio | `municipio`, `departamento`, `variable` |
| `variable_seleccionada` | Cambio de variable | `variable`, `origen` |
| `anio_cambiado` | Cambio de año o de la selección múltiple | `anios`, `origen` |
| `tabla_vista` | Cambio entre pestañas de la tabla | `vista` |
| `tabla_orden` | Ordenar por una columna | `columna`, `direccion`, `vista` |
| `tabla_busqueda` | Búsqueda en la tabla (≥2 caracteres, debounce 800 ms) | `termino`, `vista` |
| `exportar_xlsx` | Descarga del Excel | `vista`, `filas`, `anios` |
| `ficha_departamento` | Se abre la ficha de un departamento | `departamento`, `anios` |
| `ficha_municipio` | Se abre la ficha de un municipio | `municipio`, `departamento` |
| `navegar_a_ficha` | Clic que lleva a una ficha desde otra vista | `destino`, `origen` |
| `grafica_orden` | Cambio de orden del ranking | `direccion`, `variable` |
| `dispersion_ejes` | Cambio de eje X o Y en el scatter | `eje`, `variable` |
| `inicio_cta` | Clic en un botón de la portada | `destino`, `origen` |

Los eventos de selección solo se emiten cuando el estado **cambia de verdad**:
deseleccionar un departamento o volver a hacer clic en la pestaña activa no
genera evento. Sin esa guarda los conteos se inflan y dejan de ser comparables
entre vistas.

La pregunta que estos eventos contestan no es «cuánta gente entró» sino «qué
partes del trabajo valieron la pena»: si `ficha_municipio` se mueve, la
extracción de municipios se justificó; si `exportar_xlsx` es alto, la gente
quiere los datos crudos y conviene publicar un CSV directo.

### Cómo se instrumenta el frontend

Las vistas de página se registran solas: el tracker de Umami intercepta
`history.pushState`, así que las rutas de React Router funcionan sin código
adicional.

Los eventos de uso se disparan desde `frontend/src/lib/analytics.ts`:

```ts
import { track } from "@/lib/analytics";

track("exportar_xlsx", { vista: "municipios", filas: 340 });
```

Reglas del módulo:

- Los nombres de evento son una **unión cerrada** (`type Evento`). Para agregar
  uno hay que declararlo primero — así un typo es error de compilación y no una
  fila huérfana en la base de Umami.
- Todo queda **inerte** si falta `VITE_UMAMI_URL` o `VITE_UMAMI_WEBSITE_ID`: ni
  se inyecta el script ni se envían eventos.
- `track()` nunca lanza. Si un bloqueador impidió cargar el tracker, la llamada
  simplemente no hace nada.
- Para cajas de búsqueda existe `trackDebounced()`, que espera 800 ms de
  inactividad en vez de emitir por pulsación.

Al agregar un evento, actualizar también la tabla de arriba.

---

## Convenciones de código

### Backend (Python)

- **Formato**: `ruff format` + `ruff check`
- **Tipos**: anotaciones completas en todos los endpoints y funciones
- **Async**: todos los endpoints y operaciones de DB son `async/await`
- **Naming**: snake_case para variables y funciones, PascalCase para modelos y schemas

### Frontend (TypeScript)

- **Formato**: Prettier con config por defecto
- **Linting**: ESLint con reglas de React y TypeScript
- **Naming**: camelCase para variables/funciones, PascalCase para componentes y tipos
- **Componentes**: un archivo por componente, co-localizar estilos específicos si aplica
- **Imports**: absolutos desde `src/` configurados en `tsconfig.json` y `vite.config.ts`

### Git

- Ramas: `main` (producción), `dev` (desarrollo), `feat/nombre` (features)
- Commits en español, imperativo: `"Agrega mapa choropleth"`, `"Corrige endpoint de GeoJSON"`

---

## Próximos pasos para Claude Code

1. Generar el scaffold inicial con `docker compose up --build`
2. Crear los modelos SQLAlchemy y ejecutar `alembic upgrade head`
3. Implementar el script de seed con los datos del documento
4. Construir los endpoints FastAPI en orden: `/departamentos` → `/geo` → `/indicadores/resumen`
5. Inicializar shadcn/ui en el frontend e instalar los componentes listados
6. Implementar el store de Zustand antes de cualquier componente visual
7. Construir el mapa choropleth D3 como primer módulo visual
8. Agregar gráficas Recharts, tabla TanStack y fichas de departamento
9. Aplicar la guía de diseño `frontend-design` en cada componente

---

*Documento generado como punto de partida para Claude Code. Actualizar conforme evolucione el proyecto.*