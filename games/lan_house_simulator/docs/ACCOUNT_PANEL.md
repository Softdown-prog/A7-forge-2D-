# Conta opcional e painel do jogador

Publicado em 14/10/2026: https://lhs.analysepro.com/conta/ . A publicação mantém o motor do jogo no commit `8c26f0aa7c99a7ca4ef86ecedf43b71b23f0ce53` solicitado pelo usuário; as alterações são na camada do site. Código da continuação no branch `feat/lhs-cloud-backend` / PR #22.

## Funcionamento

- Página `/conta/` com login, cadastro, confirmação/reenvio de email e recuperação de senha via Firebase Authentication. Email confirmado é exigido pela API antes de abrir o painel.
- Painel com email da conta, saldo de Cookies informado pelo backend e data do save principal. Pagamentos continuam desativados.
- Save manual: exportar JSON pelo menu do jogo, selecionar no painel e confirmar o envio. O arquivo passa pelo validador do jogo antes de ser enviado e é validado novamente pela API. Principal anterior vira backup. Limite de 2 MB; revisão esperada evita sobrescrita concorrente. HTTP 409 exige conferir a nuvem antes de decidir repetir.
- Download do principal ou backup pelo painel; para restaurar, importar o JSON pelo menu do jogo. Não há alteração automática da partida em execução nem envio periódico à nuvem.
- A sessão acompanha a navegação e recargas na mesma aba, usando sessionStorage por até oito horas. Ao retomar, o cliente renova o token e valida a identidade e o acesso ao backend. Sair da conta remove a sessão. A senha não é armazenada pelo site; Firebase recebe a senha e Cloud Run recebe apenas o token.
- Jogar continua gratuito e disponível sem conta. Nenhuma alteração no motor, economia ou saves locais foi incluída na versão publicada.

## Configuração e contato

`account-config.json` contém somente a URL pública da API e a chave pública Firebase dedicada `lhs-web-auth`, habilitada para o painel. A chave é restrita às APIs `identitytoolkit.googleapis.com` e `securetoken.googleapis.com`, às origens LHS do domínio/Pages e a `https://loyal-road-395203.firebaseapp.com/*` (página oficial que conclui confirmação e recuperação); não é uma credencial administrativa. O [handler padrão do Firebase](https://firebase.google.com/docs/auth/custom-email-handler) permanece em uso, sem mudar os templates compartilhados do projeto. CORS do Cloud Run aceita o domínio e o Pages de produção. A política CSP do build permite apenas os endpoints necessários. A restrição da chave não substitui a verificação de identidade e de UID na API.

`online-config.json` continua desabilitado: o antigo controle dentro do jogo não é usado por esta publicação. `website/config.mjs` usa a marca Softdown do projeto e o contato `softloady@gmail.com`, informado pelo usuário, sem presumir razão social. Termos, privacidade e ajuda descrevem a conta e o fluxo manual. O site mantém o modo de prévia/noindex; a abertura do painel não liga pagamentos nem transforma a prévia em lançamento comercial.

## Validação

- 12 testes direcionados aprovados: 7 do cliente de autenticação e 5 existentes do site. Incluem senha somente no Firebase, renovação, sessão encerrada durante renovação, conflito sem retry automático de upload, reenvio após falha de email e recuperação sem revelar conta inexistente.
- Build do site da versão solicitada: 11 páginas, 12 HTML, 385 referências locais, 52 módulos verificados.
- Cliente validado contra Firebase/Cloud Run com chave restrita: login, confirmação, conta, save, refresh e logout. Conta temporária removida.
- Interface publicada validada em desktop e celular (390 px, sem rolagem horizontal). Login real com conta artificial confirmada, consulta de saldo/save, envio de JSON, confirmação da gravação e download do principal. Conta artificial, save GCS e documentos Firestore removidos ao final.
- Nenhum email de teste foi enviado ao contato do usuário. Entrega em caixas postais reais e telas de ação de email dependem do Firebase e ainda precisam ser conferidas por um usuário com seu próprio email. As ações de confirmação/reenvio/recuperação estão implementadas, mas não declaramos validação de entrega postal.
- A origem do handler oficial foi verificada sem alterar senhas: um código artificial inválido em `accounts:resetPassword` recebe `INVALID_OOB_CODE` (400), enquanto uma origem externa recebe bloqueio de referrer (403). Isso confirma a restrição da chave, não entrega de email nem consumo de um código real.

Deployment Pages desta etapa: `7b568b7f.lhs-lan-house-simulator.pages.dev`. Operação do backend, backups e manutenção: [CLOUD_BACKEND_DEPLOYMENT.md](CLOUD_BACKEND_DEPLOYMENT.md).
