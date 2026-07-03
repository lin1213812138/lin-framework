#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Building LIN Framework ==="

# 1. Install dependencies
echo ">>> Installing dependencies..."
pnpm install --frozen-lockfile

# 2. Build shared package
echo ">>> Building shared package..."
pnpm --filter @lin/shared build

# 3. Build server
echo ">>> Building server..."
pnpm --filter @lin/server build

# 4. Build web
echo ">>> Building web..."
pnpm --filter @lin/admin-web build

echo "=== Build complete ==="
echo "Server dist: $ROOT_DIR/apps/server/dist"
echo "Web dist:    $ROOT_DIR/apps/admin-web/dist"
