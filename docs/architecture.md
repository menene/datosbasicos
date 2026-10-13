# Architecture Blueprint

## 1. System Overview
Plataforma web interactiva para el análisis e investigación de indicadores demográficos, socioeconómicos y de salud de los 22 departamentos de Guatemala. Combina un mapa choropleth, gráficas, tablas de datos y fichas detalladas alimentadas por una API REST y una base de datos relacional PostgreSQL.

## 2. Core Stack
- **Backend:** FastAPI (Python 3.12), SQLAlchemy 2.0 (async), Pydantic v2, Alembic, Uvicorn.
- **Frontend:** React 18, Vite 5, shadcn/ui, Tailwind CSS v3, D3.js v7 (mapas), Recharts, TanStack Table v8, Zustand, TanStack Query v5, Framer Motion.
- **Database:** PostgreSQL 16.
- **Infrastructure:** Docker & Docker Compose (dev & prod), pgAdmin (dev), Umami (analytics).

## 3. Database Schema & Entities
El modelo de datos relacional incluye:
- `region`: Regiones geográficas (e.g., metropolitana, noroccidente).
- `departamento`: Información base de cada departamento y descripción narrativa (fk: `region_id`).
- `indicador`: Indicadores numéricos anualizados por departamento (población, salud, familia, desarrollo) (fk: `departamento_id`).

Entidades sin estado persistido en base de datos (servidas vía JSON en backend):
- `municipios`: Datos municipales (geo + indicadores).
- `lagos` y `sitios`: Información de lugares de interés.

## 4. Modules & Boundaries
- **API (Backend):**
  - Rutas de datos geográficos (`/geo/*`)
  - Rutas de indicadores departamentales y municipales (`/departamentos`, `/municipios`, `/indicadores`)
  - Rutas de POIs (`/lagos`, `/sitios`)
- **UI (Frontend):**
  - **Mapa:** Renderizado SVG interactivo mediante D3.js.
  - **Gráficas:** Visualizaciones basadas en Recharts (barras y radar).
  - **Tabla:** Vista de datos densa usando TanStack Table.
  - **Ficha:** Resumen narrativo y de KPIs por departamento/municipio.
- **Seed & Data Ingestion:**
  - Scripts en `backend/app/seed/` (`enrich_departamentos.py`, `extract_municipios.py`) extraen datos de documentos `.docx` generados por el cliente, calculando valores derivados (densidad, tiempo de duplicación).

## 5. ADRs (Architecture Decision Records)
- **ADR 1 (Dual Data Sources):** Se optó por mantener los departamentos en PostgreSQL (vía SQLAlchemy) pero los municipios estáticos en JSON. Esto reduce la carga transaccional dado que los municipios no poseen histórico complejo.
- **ADR 2 (Async Database Driver):** Uso de `asyncpg` con SQLAlchemy para aprovechar la concurrencia asíncrona de FastAPI en lecturas masivas.
- **ADR 3 (Frontend State):** Uso de Zustand para estado global síncrono (filtros) y TanStack Query para fetching asíncrono desde FastAPI, separando responsabilidades de UI y red.
- **ADR 4 (Prod/Dev Build Separation):** `docker-compose.yml.example` y el `docker-compose.yml` real de producción eran, hasta ahora, el mismo archivo copiado (frontend corría `npm run dev`, backend corría `uvicorn --reload` con `ENVIRONMENT: development`), lo que exponía `/src/**`, `vite.config.ts` y la topología interna de Docker vía HTTP en el dominio público. Se introduce `docker-compose.prod.yml.example` como plantilla versionada separada, y `frontend/Dockerfile` pasa a multi-stage (`dev` / `production`), donde `production` sirve el `dist/` compilado vía nginx en vez del dev server de Vite.
