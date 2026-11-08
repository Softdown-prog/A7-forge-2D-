#!/bin/sh
# Forced SSH command, deliberately ignores SSH_ORIGINAL_COMMAND and all arguments.
exec /usr/bin/cat /run/lhs-runner/health.json
