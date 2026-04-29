#!/bin/bash
set -euo pipefail

ENV_FILE=".env.production"
COMPOSE_ARGS=(--env-file "$ENV_FILE" -f compose.yaml -f compose.production.yaml)

echo "🚀 Iniciando despliegue de citasmedicas-app..."

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Falta $ENV_FILE. Cópialo desde .env.production.example y ajusta sus valores."
  exit 1
fi

echo "📥 Actualizando código desde Git..."
git pull origin main

echo "🏗️  Reconstruyendo imágenes..."
docker compose "${COMPOSE_ARGS[@]}" build --no-cache

echo "🆙 Reiniciando contenedores..."
docker compose "${COMPOSE_ARGS[@]}" up -d

echo "🧹 Limpiando imágenes antiguas..."
docker image prune -f

echo "✅ Despliegue completado."
echo "🌐 Verifica el dominio configurado en CLIENT_ORIGIN y el Proxy Host en Nginx Proxy Manager."
