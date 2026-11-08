#!/usr/bin/env bash
# Dedicated CI container. Never grants sudo or the production Docker socket to jobs.
set -Eeuo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run as administrator'; exit 1; }
source_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
install_dir=/opt/lhs-ci
runner_name="${RUNNER_NAME:-lhs-vps-$(hostname -s)}"
case "$(uname -m)" in
  x86_64) arch=x64 ;;
  aarch64|arm64) arch=arm64 ;;
  *) echo 'Unsupported architecture'; exit 1 ;;
esac
for executable in docker curl python3 sha256sum install; do command -v "$executable" >/dev/null; done
if id lhsstatus >/dev/null 2>&1; then echo 'Existing status identity requires review'; exit 1; fi
if docker container inspect lhs-ci-runner >/dev/null 2>&1 ||
   docker volume inspect lhs_ci_runner_data >/dev/null 2>&1; then
  echo 'Existing LHS runner detected; refusing to overwrite registration/data.'; exit 1
fi
: "${RUNNER_TOKEN_FILE:?Private file containing a fresh registration token is required}"
: "${STATUS_PUBLIC_KEY_FILE:?Public key for the read-only status account is required}"
[[ -s "$RUNNER_TOKEN_FILE" && -s "$STATUS_PUBLIC_KEY_FILE" ]]
release="$(curl -fsSL --retry 2 https://api.github.com/repos/actions/runner/releases/latest)"
read -r package_url package_sha < <(printf '%s' "$release" | python3 -c '
import json,sys
assets=[a for a in json.load(sys.stdin)["assets"] if a["name"].startswith("actions-runner-linux-"+sys.argv[1]+"-") and a["name"].endswith(".tar.gz")]
assert len(assets)==1
print(assets[0]["browser_download_url"],(assets[0].get("digest") or "").removeprefix("sha256:"))
' "$arch")
[[ "$package_url" =~ ^https://github.com/actions/runner/releases/download/ ]]
[[ "$package_sha" =~ ^[a-fA-F0-9]{64}$ ]]
build_tmp="$(mktemp -d /tmp/lhs-runner-build.XXXXXX)"
trap 'rm -f -- "$build_tmp/runner.tar.gz"; rmdir -- "$build_tmp"' EXIT
curl -fL --retry 2 "$package_url" -o "$build_tmp/runner.tar.gz"
printf '%s  %s\n' "$package_sha" "$build_tmp/runner.tar.gz" | sha256sum -c -
install -d -m 0755 "$install_dir"
for file in runner.Dockerfile runner.compose.yaml runner-entrypoint.sh runner-admission.sh runner-cleanup.sh runner-policy.py runner-status-update.py runner-status-export.sh; do
  install -m 0644 "$source_dir/$file" "$install_dir/$file"
done
# Only this build context is sent to Docker, not application data or credentials.
docker build -f "$install_dir/runner.Dockerfile" -t lhs-actions-runner:isolated "$install_dir"
cd "$install_dir"
docker compose -f runner.compose.yaml config --quiet
# The verified binary exists only in its persistent volume, not twice in image layers.
docker compose -f runner.compose.yaml run --rm --no-deps \
  -v "$build_tmp/runner.tar.gz:/run/secrets/runner-package:ro" runner /bin/bash -c '
    test -z "$(ls -A /runner)" && tar -xzf /run/secrets/runner-package -C /runner
  '
# Registration token is a one-time read-only mount, absent from the permanent container.
docker compose -f runner.compose.yaml run --rm --no-deps \
  -v "$RUNNER_TOKEN_FILE:/run/secrets/registration-token:ro" \
  -e RUNNER_NAME="$runner_name" runner /bin/bash -c '
    exec ./config.sh --unattended --url https://github.com/Softdown-prog/A7-forge-2D- \
      --token "$(cat /run/secrets/registration-token)" --name "$RUNNER_NAME" \
      --labels lhs-vps-isolated --work _work
  '
docker compose -f runner.compose.yaml up -d --no-deps runner

# Read-only forced command: this identity cannot reach Docker or execute a shell command.
useradd --system --home-dir /var/lib/lhs-runner-status --shell /bin/sh lhsstatus
install -d -m 0755 -o root -g root /var/lib/lhs-runner-status /var/lib/lhs-runner-status/.ssh
printf 'restrict,command="/usr/local/sbin/lhs-runner-status-export" %s\n' "$(cat "$STATUS_PUBLIC_KEY_FILE")" > /var/lib/lhs-runner-status/.ssh/authorized_keys
chmod 0644 /var/lib/lhs-runner-status/.ssh/authorized_keys
install -m 0755 runner-status-export.sh /usr/local/sbin/lhs-runner-status-export
install -m 0755 runner-status-update.py /usr/local/sbin/lhs-runner-status-update
cat > /etc/systemd/system/lhs-runner-status.service <<'UNIT'
[Unit]
Description=Read-only LHS CI runner health snapshot
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/lhs-runner-status-update
RuntimeDirectory=lhs-runner
RuntimeDirectoryPreserve=yes
NoNewPrivileges=yes
ProtectHome=yes
ProtectSystem=strict
ReadWritePaths=/run/lhs-runner
MemoryMax=64M
CPUQuota=20%
TimeoutStartSec=10
UNIT
cat > /etc/systemd/system/lhs-runner-status.timer <<'UNIT'
[Unit]
Description=Refresh isolated LHS runner health snapshot
[Timer]
OnBootSec=15s
OnUnitActiveSec=30s
AccuracySec=1s
Persistent=true
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl start lhs-runner-status.service
systemctl enable --now lhs-runner-status.timer
printf 'Installed runner %s; binary SHA256 %s\n' "$runner_name" "$package_sha"
