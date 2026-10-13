### Execution Order (reference)
LAYER 0: Retroactive Tests: Backend Models & DB + Retroactive Tests: Frontend State & Stores
LAYER 1: Retroactive Tests: Backend API Routes (depends on Backend Models)

# Issue: Retroactive Tests: Backend Models & DB (1/3) [Improvement]
- **User Story:** As a developer, I want automated tests for database models and seed scripts, So that I know data ingestion and queries work correctly.
- **Technical Scope:**
  - Files to Create: `backend/tests/conftest.py`, `backend/tests/test_models.py`, `backend/tests/test_seed.py`
  - Do NOT Touch boundaries: Do not write route tests yet.
- **Acceptance Criteria:**
  - **Given** the test database
  - **When** I run model tests
  - **Then** they successfully insert and query `departamento` and `indicador` records using native Postgres features
- **Verification Command:** `docker compose exec backend pytest backend/tests/test_models.py`

# Issue: Retroactive Tests: Backend API Routes (2/3) [Improvement]
- **User Story:** As a developer, I want HTTP feature tests for the FastAPI routers, So that API contracts are protected against regressions.
- **Technical Scope:**
  - Files to Create: `backend/tests/api/test_departamentos.py`, `backend/tests/api/test_municipios.py`, `backend/tests/api/test_geo.py`
  - Do NOT Touch boundaries: Do not modify route logic.
- **Acceptance Criteria:**
  - **Given** the FastAPI app
  - **When** I run route tests
  - **Then** happy-path responses return 200 OK with the correct JSON schema
- **Verification Command:** `docker compose exec backend pytest backend/tests/api/`

# Issue: Retroactive Tests: Frontend State & Stores (3/3) [Improvement]
- **User Story:** As a developer, I want unit tests for the frontend Zustand stores and utility functions, So that the map and table filters are robust.
- **Technical Scope:**
  - Files to Create: `frontend/src/store/filtros.test.ts`, `frontend/src/store/seleccion.test.ts`, `frontend/src/lib/derivados.test.ts`
  - Do NOT Touch boundaries: Do not write UI component tests yet.
- **Acceptance Criteria:**
  - **Given** the Zustand stores
  - **When** state actions are dispatched
  - **Then** the store updates correctly and calculated properties are accurate
- **Verification Command:** `cd frontend && npm run test`
