# LHS: VPS como runner prioritário do GitHub Actions

## Objetivo e estado

Os workflows Linux do repositório usam `.github/workflows/lhs-runner-route.yml` antes dos jobs. Esse seletor verifica o estado de um runner Linux com a label **lhs-vps** e:

- **Online**: escolhe `["self-hosted","Linux","lhs-vps"]` (VPS prioritária).
- **Offline, não registrado, falha de API ou segredo ausente**: mantém o executor Ubuntu do GitHub originalmente usado pelo workflow (`ubuntu-latest` ou `ubuntu-24.04`).
- Jobs Windows de verdade, como `a7-forge-2d-windows.yml`, continuam com `[self-hosted, Windows, X64]`.

O fallback é decidido **antes de enviar cada job**. O GitHub Actions não oferece failover nativo automático de um job já atribuído à VPS caso ela caia depois dessa escolha. Nessa situação, reexecute o workflow quando voltar ou use temporariamente o hosted desabilitando/removendo o segredo de seleção.

O roteador preserva os testes, os artefatos, as condições de PR, o controle de concorrência, os gates de produção e a seleção de commit da publicação.

## 1. Registrar um runner separado na VPS

Acesse a VPS por SSH e execute:

```bash
curl -fsSL \
  https://raw.githubusercontent.com/Softdown-prog/A7-forge-2D-/main/scripts/ci/install-lhs-vps-runner.sh \
  -o /tmp/install-lhs-vps-runner.sh
sudo bash /tmp/install-lhs-vps-runner.sh
```

Quando solicitar o token temporário, obtenha um **novo** em:

`A7-forge-2D- > Settings > Actions > Runners > New self-hosted runner`.

**Não cole o token no chat nem o salve no Git.** Se um token foi mostrado em captura de tela, descarte-o e gere outro (ele também expira rapidamente).

O instalador detecta `uname -m`:

- `x86_64` → pacote oficial `linux-x64`
- `aarch64` / `arm64` → pacote oficial `linux-arm64`

Ele valida o SHA-256 do arquivo oficial, cria `/opt/lhs-actions-runner` e um usuário de serviço `lhsrunner`, registra a label `lhs-vps`, adiciona suporte a Docker e `sudo apt-get` para os jobs existentes e habilita um serviço systemd persistente. Não remove ou substitui runners de outros projetos.

**Dependências:** o instalador prepara Git, rsync, ffmpeg, utilitários e acesso ao Docker **caso o daemon já esteja instalado**. O workflow `lhs-backend.yml` também usa `pwsh`; instale PowerShell 7 na VPS antes de executar essa validação nela. Para Playwright, a instalação de Chromium/dependências já existe nos workflows e precisa de `sudo apt-get`.

A VPS deve ter saída HTTPS para o GitHub. Nenhuma porta de entrada exclusiva para o runner é necessária.

## 2. Ativar seleção automática com fallback

O GitHub exige permissão administrativa de **leitura** para consultar a lista de runners do repositório. O `GITHUB_TOKEN` comum do workflow não possui essa permissão.

Crie um **fine-grained personal access token** limitado ao repositório `Softdown-prog/A7-forge-2D-`, com `Repository permissions > Administration: Read-only`. Não use o token temporário de registro para isso.

Salve esse token em:

`Settings > Secrets and variables > Actions > New repository secret`

Nome exato:

```text
LHS_RUNNER_STATUS_TOKEN
```

Sem esse segredo, a rota retorna para o GitHub-hosted por padrão; isso evita deixar CI em fila antes da VPS ficar pronta. A execução do seletor em GitHub-hosted é breve; **a compilação e os testes continuam na VPS** quando ela está online.

## 3. Diagnóstico e verificação

Em `Actions > LHS | diagnostico do runner > Run workflow`, execute o diagnóstico manual.

O log de `select-runner` deve indicar `VPS online`. O job `check` informa `RUNNER_NAME`, `RUNNER_ARCH`, `uname -m`, Docker, ffmpeg, rsync, PowerShell e outras capacidades.

Verifique em `Settings > Actions > Runners` que a VPS aparece como **Online** com a label **lhs-vps**. Confira também se o serviço sobrevive ao reboot:

```bash
sudo systemctl list-units --type=service 'actions.runner*'
```

A VPS recebe inicialmente **um único runner**. Com isso não se iniciam vários builds Chromium/Docker em paralelo sem necessidade numa VPS que hospeda outras aplicações.

## Observações de operação

- Em um único runner, jobs simultâneos aguardam fila. O seletor considera um runner **online** elegível mesmo quando marcado como `busy`, priorizando a VPS.
- Para fallback quando a VPS está offline antes do envio do job, basta manter o segredo de consulta funcional.
- Falhas de compilação não são tratadas como queda da VPS: testes reprovados devem continuar reprovados.
- Permissões de Docker e instalação de pacotes dão privilégios elevados ao usuário `lhsrunner`. Esse ambiente executa código de PRs admitidos pelos workflows atuais. Mantenha esse runner dedicado ao projeto e não armazene segredos diretamente em seu diretório de trabalho.
