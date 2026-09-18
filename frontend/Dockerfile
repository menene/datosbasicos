# --- build: compiles the Vite/React app to static assets -------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

# Vite inlines VITE_* vars into the bundle at build time, so they must be
# supplied as build args here — passing them as container env at runtime
# (like the dev stage does) has no effect once the app is a static bundle.
ARG VITE_API_URL
ARG VITE_UMAMI_URL
ARG VITE_UMAMI_WEBSITE_ID
ENV VITE_API_URL=$VITE_API_URL \
    VITE_UMAMI_URL=$VITE_UMAMI_URL \
    VITE_UMAMI_WEBSITE_ID=$VITE_UMAMI_WEBSITE_ID
RUN npm run build

# --- production: serves the built assets as static files -------------------
FROM caddy:2-alpine AS production
COPY --from=build /app/dist /srv
COPY Caddyfile.static /etc/caddy/Caddyfile
EXPOSE 80

# --- dev (default target, used by docker-compose.yml.example) --------------
FROM node:20-alpine AS dev
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
