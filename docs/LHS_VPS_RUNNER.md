# LHS — runner VPS isolado e fallback

## Destino dos jobs

Um runner Linux `lhs-vps-isolated` recebe push na main e disparos manuais pelo
proprietário. PRs/forks, push em branches não revisadas e outros eventos usam
GitHub-hosted. Um hook no runner também recusa esses eventos antes dos passos.
Os três workflows que precisam de Docker (backend, clean-angular-rewrite e
sac-angular-diagnostic) continuam no GitHub. Windows mantém o runner original.

O container `lhs-ci-runner` tem 2 CPUs, 2 GiB RAM, 768 processos, logs 2 × 10 MiB e
nenhuma porta publicada. Executa um job por vez. Não recebe socket Docker,
diretórios de produção, senhas do host ou redes privadas dos projetos. É root
somente no container de CI, para apt/Playwright funcionarem; não tem privileged,
host network ou SYS_ADMIN. Não há novo usuário com sudo/Docker no host.
O volume `lhs_ci_runner_data` contém apenas dados/ferramentas do runner. Um hook
remove checkouts após o job; ferramentas em cache são reutilizadas.

O pacote oficial é verificado e extraído uma única vez no volume; nem o arquivo
compactado nem uma segunda cópia dos binários ficam na imagem de execução.
Recriar o container preserva o registro e o volume. O listener encaminha sinais
de encerramento para liberar sua sessão ao parar. Limpeza de imagens nunca deve
remover esse volume ou arquivos de autenticação.

## Disponibilidade sem copiar PAT amplo

O secret `LHS_RUNNER_STATUS_TOKEN` aceita chave SSH dedicada somente de leitura
ou PAT Administration/read restrito a este repositório. Não copiar o token amplo
do gh CLI. Com SSH, a conta `lhsstatus` tem forced-command e restrict: só pode ler
um JSON, sem sudo, Docker, PTY, forwarding ou shell livre. O host recebe apenas a
chave pública; a privada fica no secret. A host key pública está fixada no código.

Um timer atualiza o snapshot a cada 30s com a saúde do listener e conexão HTTPS
ao GitHub. O roteador recusa snapshot indisponível/unhealthy, futuro ou com mais
de 90s e retorna ao GitHub-hosted. É saúde local, não a API oficial de runners;
a instalação também confirma online pela API e executa um workflow real.

A seleção é anterior à fila. Uma queda posterior não migra o job já atribuído:
é necessário reexecutar. Erro de teste não é tratado como queda da VPS.

## Instalação e recuperação

Revisar uma revisão consistente de scripts/ci. Como administrador, fornecer os
arquivos privados temporários RUNNER_TOKEN_FILE (registro novo/temporário) e
STATUS_PUBLIC_KEY_FILE; executar install-lhs-vps-runner.sh. O instalador detecta
x64/ARM64 e exige o SHA-256 oficial antes de construir a imagem Ubuntu 24.04.
Não instala pacotes no host, altera runners existentes nem sobrescreve volume ou
registro existente. Remover o arquivo de token após registro. Não salvar chaves
no repositório. Os passos apt dos jobs afetam apenas o container de CI.

Docker e restart unless-stopped mantêm o runner no boot, sem reiniciar a VPS.
Atualizações do runner ficam em seu volume. Para reversão, parar somente
lhs-ci-runner, desativar lhs-runner-status.timer e retirar seu registro GitHub;
a ausência do probe seleciona GitHub-hosted. Não apagar volumes de projetos.

## Validação

O diagnóstico manual informa nome/arquitetura, confirma ausência do socket e de
credenciais do host, verifica política, compila o LHS e executa regressões.
O workflow de validação roda em GitHub-hosted e testa o build da imagem,
limites, admissão e recusa de PR. Código/CI não comprovam instalação: confirmar
online na API GitHub e nome do runner no job realmente executado.
