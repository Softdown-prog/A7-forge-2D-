# Confirmação de conta LHS

O site `https://lhs.analysepro.com` cria contas com Firebase Authentication. O envio pode ser feito pelo Resend sem alterar os modelos ou o SMTP das outras aplicações do projeto Firebase.

## Configuração

- Domínio Resend: `lhs.analysepro.com`, região `sa-east-1`.
- Remetente: `LHS <contas@lhs.analysepro.com>`; respostas: `softloady@gmail.com`.
- Secret Manager: `lhs-resend-api-key`, somente leitura pelo service account do backend. Use uma chave Resend com **Sending access**, restrita a `lhs.analysepro.com`. Nunca coloque a chave no GitHub, frontend ou Cloudflare Pages.
- Cloud Run: `RESEND_API_KEY` referencia uma versão do segredo; `VERIFICATION_EMAIL_PROVIDER=resend` ativa o envio. Sem essa opção, o site continua com o envio Firebase existente.
- `PUBLIC_SITE_URL=https://lhs.analysepro.com` define o retorno para `/conta/` após confirmar.
- `VERIFICATION_EMAIL_DAILY_LIMIT` limita o total de tentativas por dia UTC (padrão 100). Ajuste segundo a capacidade contratada do provedor. Cada destinatário pode solicitar uma mensagem por minuto, três por hora e seis por dia. Falhas também consomem a cota, para conter abuso e tentativas simultâneas.
- O backend precisa de `firebaseauth.users.sendEmail`, além da permissão de consulta de usuários já existente. Use uma função personalizada com somente essa permissão adicional.

## DNS

Na zona Cloudflare `analysepro.com`, a configuração atual fornecida pelo Resend usa TXT em `resend._domainkey.lhs` (chave DKIM específica desse domínio), CNAME em `rsend.lhs` para `rsend-sae1.forge.rmta.net` e CNAME em `send.lhs` para `send.forge.rmta.net`. São registros sem proxy, TTL Auto ou 3600. Os dois registros classificados como SPF no painel são CNAMEs, não registros TXT ou MX nesta configuração. Preserve os registros de outros nomes e o CNAME do site `lhs` para o Pages.

Depois de confirmar que esses valores estão no DNS público, clique em **Verify DNS Records** no domínio no painel Resend. O estado `failed` no painel não deve ser interpretado como verificado apenas porque o DNS está correto.

## Fluxo e segurança

1. O cliente mantém a sessão apenas na memória e consulta `/v1/config` para escolher o provedor.
2. Para Resend, chama `POST /v1/auth/verification-email` com seu token Firebase. Senha, email de destino e UID não são enviados no corpo.
3. O servidor valida a sessão com checagem de revogação, consulta o endereço da própria conta e reserva as cotas em uma transação Firestore.
4. Firebase Admin gera o link de confirmação, enviado somente ao destinatário via Resend. O código não é devolvido ao cliente, gravado em Firestore ou registrado nos logs.
5. O jogador confirma pelo link e usa “Já confirmei meu email” para atualizar o token. Saves, saldo e compras continuam exigindo email confirmado.

`online-config.json` mantém o painel experimental de nuvem dentro do jogo desativado. O cadastro público acontece nas páginas Conta e Donate. A recuperação de senha continua usando Firebase.

## Validação

Execute `node --test backend/tests/*.test.mjs tests/account-client.test.mjs tests/donate.test.mjs tests/website.test.mjs` após compilar o jogo e `npm run build:site && npm run check:site`. Os testes cobrem proprietário do destinatário, limites concorrentes, cotas, falhas do provedor e sessão revogada. Um envio real só deve ser declarado validado após configurar a chave e verificar o domínio Resend.

Referências: [DNS Cloudflare no Resend](https://resend.com/docs/guides/dns/cloudflare), [envio de email](https://resend.com/docs/api-reference/emails/send-email), [links de confirmação Firebase](https://firebase.google.com/docs/auth/admin/email-action-links).
