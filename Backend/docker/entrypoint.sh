#!/bin/sh
set -e
if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  npx prisma migrate deploy
elif [ "$ALLOW_DB_PUSH" = "true" ]; then
  echo "WARN: no prisma/migrations found; using 'prisma db push' (dev/first-run only)." >&2
  npx prisma db push --skip-generate
else
  echo "ERROR: prisma/migrations is missing. Run 'npx prisma migrate dev --name init' locally and commit it," >&2
  echo "       or set ALLOW_DB_PUSH=true for a throwaway first run." >&2
  exit 1
fi
npx prisma db execute --file prisma/sql/hardening.sql --schema prisma/schema.prisma
if [ -f dist/src/main.js ]; then
  exec node dist/src/main
else
  exec node dist/main
fi
