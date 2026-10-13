### Execution Order (reference)
LAYER 0: Replace Vite dev server with production build in frontend image + Harden FastAPI: rate limiting and strict CORS (parallel, no deps)
LAYER 1: Add production docker-compose and Caddy edge reference (depends on L0)

# Issue: Replace Vite dev server with production build in frontend image (1/3) [Bug]
- **User Story:** As the site operator, I want the frontend container to serve a real production build instead of the Vite dev server, So that raw TypeScript source, `vite.config.ts`, and internal Docker topology are no longer exposed over HTTP.
- **Technical Scope:**
  - Files to Create: `frontend/.dockerignore`, `frontend/nginx.conf`
  - Files to Modify: `frontend/Dockerfile` (add a `dev` target preserving today's `npm run dev -- --host 0.0.0.0` behavior, and a `production` target: a `node:20-alpine` build stage running `npm run build`, then an `nginx:alpine` runtime stage serving `dist/` with SPA fallback `try_files $uri /index.html` and baseline headers `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`)
  - Do NOT Touch boundaries: `frontend/vite.config.ts` dev server settings (`host`, `allowedHosts`, `proxy`) stay unchanged — they only affect the `dev` target and are inert once `production` no longer runs `vite`.
- **Acceptance Criteria:**
  - **Given** an image built with `--target production`
  - **When** the container serves the root path
  - **Then** `/src/main.tsx` and `/vite.config.ts` return 404, and the served `index.html` references hashed `/assets/*.js` bundles, not `/src/main.tsx`
- **Verification Command:** `docker build --target production -t frontend-prod ./frontend && docker run -d -p 8080:80 frontend-prod && curl -sI http://localhost:8080/src/main.tsx | head -1`

# Issue: Harden FastAPI: rate limiting and strict CORS (2/3) [Bug]
- **User Story:** As the site operator, I want the public API to rate-limit clients and stop allowing credentialed wildcard cross-origin requests, So that the API is resilient to scraping/abuse and follows least-privilege CORS for a public read-only dataset.
- **Technical Scope:**
  - Files to Create: `backend/tests/test_api_hardening.py`
  - Files to Modify: `backend/requirements.txt` (add `slowapi`), `backend/app/main.py` (wire a `Limiter` keyed by client IP at 60 req/min via SlowAPI middleware; set `allow_credentials=False`, `allow_methods=["GET"]`, and an explicit `allow_headers` list on `CORSMiddleware` instead of wildcards)
  - Do NOT Touch boundaries: route logic in `backend/app/routers/*` stays unchanged.
- **Acceptance Criteria:**
  - **Given** more than 60 requests/minute from one IP
  - **When** hitting any route
  - **Then** the 61st request returns HTTP 429
  - **Given** a CORS preflight from a disallowed origin
  - **When** requested against any `/api/v1/*` route
  - **Then** no `Access-Control-Allow-Origin` header is returned in the response
- **Verification Command:** `docker compose exec backend pytest backend/tests/test_api_hardening.py`

# Issue: Add production docker-compose and Caddy edge reference (3/3) [Bug]
- **User Story:** As the site operator, I want a dedicated, tracked production compose template and a reference Caddy config, So that production no longer copies the dev template verbatim (today `docker-compose.yml.example` and the real prod `docker-compose.yml` are functionally identical: `npm run dev`, `uvicorn --reload`, `ENVIRONMENT: development`), and the edge terminates TLS with HSTS and forces HTTP→HTTPS.
- **Technical Scope:**
  - Files to Create: `docker-compose.prod.yml.example`, `docs/Caddyfile.example`
  - Do NOT Touch boundaries: `docker-compose.yml.example` stays as-is (the dev reference).
- **Acceptance Criteria:**
  - **Given** `docker-compose.prod.yml.example`
  - **When** compared to the dev template
  - **Then** the frontend service builds with `target: production` and no source bind-mount, and the backend service runs `uvicorn app.main:app --host 0.0.0.0 --port 8000` (no `--reload`) with `ENVIRONMENT: production`
  - **Given** `docs/Caddyfile.example` applied on the server
  - **When** a client requests `http://datosbasicos.gt/`
  - **Then** it 301/308-redirects to HTTPS, and the HTTPS response includes `Strict-Transport-Security`, `X-Content-Type-Options`, and `Referrer-Policy` headers
- **Verification Command:** `docker compose -f docker-compose.prod.yml.example config`
