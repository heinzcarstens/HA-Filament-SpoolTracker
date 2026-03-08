#!/usr/bin/with-contenv bashio

set -e

DATABASE_URL=$(bashio::config 'database_url')
LOG_LEVEL=$(bashio::config 'log_level')

INGRESS_PORT=$(bashio::addon.ingress_port)
ADDON_VERSION=$(bashio::addon.version)

bashio::log.info "Starting HA Filament SpoolTracker v${ADDON_VERSION}..."

export NODE_ENV=production
export HOME_ASSISTANT=true
export PORT="$INGRESS_PORT"
export LOG_LEVEL="$LOG_LEVEL"
export ADDON_VERSION="$ADDON_VERSION"
export APP_ROOT="/app"
export SERVER_PATH="/app/server"
export CLIENT_PATH="/app/client"

cd "$APP_ROOT"

# Database is optional — only configure if URL is provided
if [ -n "$DATABASE_URL" ]; then
  export DATABASE_URL="$DATABASE_URL"
  bashio::log.info "Database configured at ${DATABASE_URL}"
else
  export DATABASE_URL="file:/data/app.db"
  bashio::log.info "No database URL configured — using local SQLite at /data/app.db"
fi

bashio::log.info "Syncing database schema..."
pnpm prisma:migrate || bashio::log.warning "Schema sync failed — continuing without database"

bashio::log.info "Starting application on port $PORT..."
pnpm start
