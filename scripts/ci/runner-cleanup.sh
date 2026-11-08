#!/usr/bin/env bash
set -euo pipefail
# This path exists only inside the dedicated CI volume. No host project is mounted.
cd /runner/_work
find . -mindepth 1 -maxdepth 1 -type d \
  ! -name _tool ! -name _actions ! -name _temp -exec rm -rf -- {} +
