#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
node "$PROJECT_DIR/backend/scripts/migrate.js"
