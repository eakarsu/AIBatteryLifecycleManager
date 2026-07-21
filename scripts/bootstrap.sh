#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
npm ci --prefix "$PROJECT_DIR/backend"
npm ci --prefix "$PROJECT_DIR/frontend"
