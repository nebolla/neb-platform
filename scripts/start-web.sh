#!/usr/bin/env bash
set -euo pipefail
cd apps/web
node node_modules/next/dist/bin/next start -p 3000 --hostname 0.0.0.0
