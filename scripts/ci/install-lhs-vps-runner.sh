#!/usr/bin/env bash
# Registra um runner Linux dedicado ao LHS sem tocar em outros runners da VPS.
set -Eeuo pipefail

REPO_URL='https://github.com/Softdown-prog/A7-forge-2D-'
RUNNER_HOME='/opt/lhs-actions-runner'
RUNNER_USER='lhsrunner'
RUNNER_NAME="${RUNNER_NAME:-lhs-vps-$(hostname -s)}"

if [[ "${EUID}" -ne 0 ]]; then
  echo 'Execute com sudo: sudo bash scripts/ci/install-lhs-vps-runner.sh' >&2
  exit 1
fi
case "$(uname -m)" in
  x86_64) ARCH='x64' ;;
  aarch64|arm64) ARCH='arm64' ;;
  *) echo "Arquitetura Linux não suportada: $(uname -m)" >&2; exit 1 ;;
esac
echo "Arquitetura detectada: $(uname -m) -> $ARCH"

# Dependências usadas por Actions, Playwright, geração de vídeo e publicação.
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    ca-certificates curl git jq rsync tar unzip ffmpeg python3 sudo
fi
for command in curl python3 tar sha256sum runuser; do
  command -v "$command" >/dev/null || {
    echo "Comando obrigatório ausente: $command" >&2
    exit 1
  }
done
if [[ -f "$RUNNER_HOME/.runner" ]]; then
  echo "Runner já configurado em $RUNNER_HOME. Não sobrescrevendo." >&2
  exit 1
fi
if systemctl list-unit-files 'actions.runner.*' --no-legend 2>/dev/null | grep -q 'lhs-vps-'; then
  echo 'Existe um serviço de runner LHS; verifique antes de duplicá-lo.' >&2
  exit 1
fi

# Instala a versão publicada oficialmente, validando o digest SHA-256 do asset.
RELEASE_JSON="$(curl -fsSL --retry 2 \
  'https://api.github.com/repos/actions/runner/releases/latest')"
read -r PACKAGE_URL PACKAGE_SHA < <(printf '%s' "$RELEASE_JSON" | python3 -c '
import json, sys
release = json.load(sys.stdin)
arch = sys.argv[1]
assets = [a for a in release["assets"] if
          a["name"].startswith("actions-runner-linux-" + arch + "-") and
          a["name"].endswith(".tar.gz")]
if len(assets) != 1:
    raise SystemExit("Asset do runner não encontrado para " + arch)
asset = assets[0]
print(asset["browser_download_url"], asset.get("digest", "").removeprefix("sha256:") or "missing")
' "$ARCH")
if [[ ! "$PACKAGE_URL" =~ ^https://github.com/actions/runner/releases/download/ ]] ||
   [[ ! "$PACKAGE_SHA" =~ ^[a-fA-F0-9]{64}$ ]]; then
  echo 'Não foi possível validar o URL/digest SHA-256 oficial. Instalação cancelada.' >&2
  exit 1
fi
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT
curl -fL --retry 2 "$PACKAGE_URL" -o "$TMPDIR/runner.tar.gz"
printf '%s  %s\n' "$PACKAGE_SHA" "$TMPDIR/runner.tar.gz" | sha256sum -c -

if ! id "$RUNNER_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$RUNNER_USER"
fi
# Jobs atuais usam Docker (backend) e sudo apt-get (Playwright/ffmpeg).
# Escopo de sudo limitado aos comandos de pacotes necessários para esses jobs.
if getent group docker >/dev/null 2>&1; then
  usermod -aG docker "$RUNNER_USER"
fi
if command -v visudo >/dev/null 2>&1; then
  printf '%s\\n' "$RUNNER_USER ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/apt, /usr/bin/dpkg" \
    > /etc/sudoers.d/90-lhsrunner
  chmod 0440 /etc/sudoers.d/90-lhsrunner
  visudo -cf /etc/sudoers.d/90-lhsrunner
fi
install -d -m 0755 -o "$RUNNER_USER" -g "$RUNNER_USER" "$RUNNER_HOME"
tar xzf "$TMPDIR/runner.tar.gz" -C "$RUNNER_HOME"
chown -R "$RUNNER_USER:$RUNNER_USER" "$RUNNER_HOME"
cd "$RUNNER_HOME"

# O token de REGISTRO é temporário e nunca é colocado no repositório.
if [[ -z "${RUNNER_TOKEN:-}" ]]; then
  if [[ ! -t 0 ]]; then
    echo 'Inicie em um terminal interativo para fornecer o token de registro.' >&2
    exit 1
  fi
  read -r -s -p 'Token de registro (GitHub > Settings > Actions > Runners): ' RUNNER_TOKEN
  echo
fi
[[ -n "$RUNNER_TOKEN" ]] || { echo 'Token vazio.' >&2; exit 1; }
runuser -u "$RUNNER_USER" -- ./config.sh \
  --unattended \
  --url "$REPO_URL" \
  --token "$RUNNER_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels lhs-vps \
  --work _work
unset RUNNER_TOKEN

# Serviço permanente: o runner sobe após reiniciar a VPS.
./svc.sh install "$RUNNER_USER"
./svc.sh start
./svc.sh status
echo 'Runner LHS registrado. Confirme o status Online no GitHub.'
echo 'Para ativar o fallback baseado no status, configure também o segredo LHS_RUNNER_STATUS_TOKEN.'
