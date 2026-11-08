#!/usr/bin/env bash
set -euo pipefail
cd /runner
if [[ $# -gt 0 ]]; then exec "$@"; fi
test -f .runner
exec ./run.sh
