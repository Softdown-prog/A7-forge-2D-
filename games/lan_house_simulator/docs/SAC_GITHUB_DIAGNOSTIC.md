# SAC + LHS: primeiro diagnóstico via GitHub Actions

Esta etapa executa o Angular site-rewrite, sem enviar o Lan House Simulator à VPS. O GitHub Actions checa o repositório do LHS e o compilador SAC no commit b4a4a9ec786e935bb8c5ddc287fe12f5ed03d8bb, instala as dependências e roda preflight, build AOT oficial e pós-compilador.

O host CI gera chave HMAC efêmera em memória, assina a evidência do build e produz out/sac-angular-site-rewrite/report.json, disponível como artifact lhs-angular-sac-diagnostic. A Summary do workflow mostra os resultados.

Esta é somente validação estática: browser_pass=false, browser=not-executed e deployment_authorized=false. A verificação Playwright do LHS e o Guardian SAC poderão ser integrados em outra microetapa; não é correto declarar aprovação do navegador agora.

Nenhum comando à VPS, nenhuma mudança ao Worker instalado, Cloudflare ou main. Não há API, deploy, chave persistida nem credenciais de escrita no repositório. O SAC de origem permanece em PR draft; atualizar o commit fixado exige revisão.
