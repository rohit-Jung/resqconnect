#!/bin/bash
# Platform+Silo Architecture - Grouped Commits

echo "=== 1. Core Migration: Platform+Silo mode & socket handlers ==="
git add apps/backend/src/socket/emergency.handlers.ts \
	apps/backend/src/socket/location.handler.ts \
	apps/backend/src/socket/index.ts \
	apps/backend/src/controllers/incident-bridge.controller.ts \
	apps/backend/src/services/internal-http.service.ts \
	apps/backend/src/routes/v1/internal.routes.ts \
	apps/backend/src/middlewares/internal-auth.middleware.ts
git commit -m "feat: add platform+silo mode with internal HTTP bridge"

echo "=== 2. Route caching by emergency type ==="
git add apps/backend/src/services/redis.service.ts \
	apps/backend/src/services/mapbox.service.ts
git commit -m "feat: sector-wise route caching with emergency type key"

echo "=== 3. Worker updates: REQUEST_ACCEPTED event ==="
git add apps/backend/src/workers/request.worker.ts
git commit -m "fix: emit REQUEST_ACCEPTED instead of JOINED_EMERGENCY_ROOM"

echo "=== 4. Mobile: TEST_MODE flag & socket handlers ==="
git add apps/mobile-user/app/emergency-tracking.tsx \
	apps/mobile-responder/app/emergency-tracking.tsx \
	apps/mobile-user/hooks/useSocketHandlers.ts \
	apps/mobile-responder/hooks/useSocketHandlers.ts \
	apps/mobile-user/.env \
	apps/mobile-responder/.env
git commit -m "feat: add TEST_MODE flag for simulation control"

echo "=== 5. Docker: shared Redis for route cache ==="
git add deploy/docker-compose.stack.yml \
	apps/backend/.env
git commit -m "feat: use shared Redis for route caching across backends"

echo "=== 6. Schema migration: @/models → @repo/db/schemas ==="
git add apps/backend/src/socket/emergency.handlers.ts \
	apps/backend/src/workers/request.worker.ts
git commit -m "refactor: migrate @/models imports to @repo/db/schemas"

echo "=== 7. Docs: platform-silo socket flow ==="
git add docs/platform-silo-socket-flow.md
git commit -m "docs: document platform+silo socket communication"

echo "=== 8. Remaining changes ==="
git add -A
git commit -m "chore: remaining platform+silo migration fixes"

echo "Done!"

