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
13. [Convenciones de código](#convenciones-de-código)

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
│           ├── seed.py           # Script de carga inicial
│           └── data/
│               ├── departamentos.json
│               └── guatemala.geojson
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
            └── colores.ts        # Escalas D3 para el choropleth
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
```

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

---

## Datos iniciales (seed)

El script `backend/app/seed/seed.py` carga:

1. Las 7 regiones geográficas de Guatemala
2. Los 22 departamentos con su descripción narrativa
3. Los indicadores 2025 de cada departamento

Los datos fuente están en `backend/app/seed/data/departamentos.json` extraídos del documento `GUATEMALA_DATOS_BÁSICOS_2026.docx`.

El GeoJSON de los departamentos debe obtenerse de GADM (https://gadm.org) nivel ADM1 para Guatemala y colocarse en `backend/app/seed/data/guatemala.geojson`.

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