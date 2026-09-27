#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "1) Health check"
curl -s "$BASE_URL/health"
printf "\n\n"

echo "2) Create task"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tasks" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Learn Docker","description":"Containerize the REST API"}')
echo "$CREATE_RESPONSE"
printf "\n\n"

echo "3) List tasks"
curl -s "$BASE_URL/api/tasks"
printf "\n"
