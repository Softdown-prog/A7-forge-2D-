# SAC + LHS: primeiro diagnóstico via GitHub Actions

Esta etapa executa o Angular site-rewrite, sem enviar o Lan House Simulator à VPS. O GitHub Actions checa o repositório do LHS e o compilador SAC no commit 06a0c5756098009165397ff6c3c45db089493de8, instala as dependências e roda preflight, build AOT oficial e pós-compilador.

O host CI gera chave HMAC efêmera em memória, assina a evidência do build e produz out/sac-angular-site-rewrite/report.json, disponível como artifact lhs-angular-sac-diagnostic. A Summary do workflow mostra os resultados.

O Guardian agora roda somente depois de preflight, build Angular AOT e postflight aprovados. Ele testa interações reais em Chromium isolado (Docker sem rede) com dois casos: pausar animações no início e expandir perguntas na página de ajuda. A avaliação do navegador só recebe pass se ambos os casos passarem, houver sandbox declarado, comprovante de artefato e rede desativada. O resultado do CI fica em fail ou unverified quando Chromium falha ou não executa. deployment_authorized=false permanece em qualquer circunstância.

Nenhum comando à VPS, nenhuma mudança ao Worker instalado, Cloudflare ou main. Não há API, deploy, chave persistida nem credenciais de escrita no repositório. O SAC de origem permanece em PR draft; atualizar o commit fixado exige revisão.

O build `site-rewrite` inclui arquivos públicos de `src/site-rewrite/public/assets` no dist para evitar falhas HTTP artificiais. O Guardian não visita o site Cloudflare: ele serve uma cópia autenticada do dist em loopback dentro do container. O checkout do SAC e a imagem Playwright estão pinados por SHA/digest. Sem chaves de deploy, SSH, VPS ou acesso ao Worker produtivo.


## Compatibilidade SAC com nomes hash do Angular
A compilação `site-rewrite` passou a usar `outputHashing: all`: `main.js` não é mais o nome gerado. A versão SAC fixada recebe um caminho de bundle **exato**, portanto não aceita padrão curinga. O harness agora executa uma compilação de descoberta, valida um único script `main-<hash>.js` e insere o nome no contrato antes de criar o comprovante. Em seguida, apaga o dist, recompila com o mesmo comando e **falha fechado** se o segundo hash divergir. A etapa SAC pós-compilador e o Guardian continuam avaliando o artefato recompilado, não uma cópia diferente.
O workflow SAC passa a observar a branch `feat/lhs-angular-next-stage-20261101` e testa o parser em Node. Nenhuma requisição à VPS ou alteração em pagamentos/deploy é necessária. O resultado SAC é uma verificação adicional e não substitui os testes do site isolado.
