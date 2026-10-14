# LHS — Contrato de infraestrutura online, saves e Cookies

**Decisão de produto: 14/10/2026.** **Estado: implementação inicial em revisão; implantação e cobrança ainda desativadas.** Veja [preparação do backend e pendências](CLOUD_BACKEND_DEPLOYMENT.md).

## 0. Nomes oficiais e identidade

- O jogo chama-se **LHS — Lan House Simulator**. O diretório técnico existente continua `games/lan_house_simulator`; este contrato não determina uma renomeação de pasta ou de código legado.
- A moeda premium é **Cookies** (**biscoitos**, 🍪, escrita exatamente **C-O-O-K-I-E-S**). Não confundir com cookies HTTP de sessão do navegador. Para código, preferir nomes inequívocos como `cookiesBalance`, `cookiesLedger` e `cookiesEntitlements`.
- Há duas economias independentes: **R$ fictícios do simulador**, usados para administrar a lan house, e **Cookies premium**, associados à conta e obtidos opcionalmente por pagamento e, caso decidido no futuro, recompensas.

## 1. Modelo de acesso e monetização

1. **LHS integralmente jogável e gratuito**: sem assinatura, compra da campanha ou desbloqueio pago obrigatório. Novas épocas, gestão, progressão, construção e funcionalidade central permanecem disponíveis a todos.
2. Conta **opcional para jogar**; criar conta apenas para benefícios online (salvar/recuperar pela nuvem e comprar/usar itens premium vinculados à identidade).
3. **Cookies** servem para **itens premium opcionais**: pôsteres, decoração, pisos, paredes, temas, aparência de bancadas, modelos visuais de computadores e outros itens especiais. Priorizar personalização; nenhum item pode ser requisito de avanço da campanha ou impedir o funcionamento de uma lan house gratuita. Itens com efeitos funcionais exigem discussão e balanceamento antes de qualquer implementação.
4. Sem anúncios obrigatórios nem mensalidade como pressuposto do modelo. Novas fontes de receita não mudam esta política sem decisão expressa.
5. Valores e pacotes de Cookies, assim como taxas de pagamento, **não estão aprovados**: preços levantados em conversas são exemplos, não tabelas para produção.
6. Cookies não podem ser sacados nem convertidos em dinheiro real; não planejar mercado de apostas, sorteios pagos ou compra/venda entre jogadores.

## 2. Arquitetura-alvo e limites do backend

```text
Cloudflare — site próprio + frontend estático HTML5/TypeScript/Canvas
   ├── renderização 2D, personagens, lógica de NPCs, simulação e saves locais
   └── UI opcional de login, salvar/carregar na nuvem e loja de Cookies
                           │ HTTPS / token autenticado
                           ▼
Google Cloud Run — API Node.js (alvo: 1 vCPU, 512 MiB RAM, mín. 0 instâncias)
   ├── valida identidade, autoriza acesso a snapshots e cria links temporários
   ├── cria pedidos e valida notificações de pagamento
   └── executa transações confiáveis de carteira/inventário
            ├── Firebase Authentication: identidade e login
            ├── Firestore: conta, Cookies, itens adquiridos, pedidos e ledger
            └── Google Cloud Storage (GCS): saves JSON privados por usuário
```

- O backend **não** executa desenho por frame, relógio por minuto nem toda a simulação: o motor atual permanece **no navegador** para manter baixa latência e custo.
- Cloud Run com `min-instances=0` e limitação de escala/concor­rência após testes de carga. Esta configuração é objetivo, não promessa de desempenho/preço.
- Firestore **não** guarda o snapshot completo do LHS. Pode guardar metadados mínimos de slot, mas a fonte do progresso salvo na nuvem é o **JSON no GCS**.
- Firebase Authentication ou equivalente cuida de senhas/identidade; o Cloud Run valida os tokens. **Não armazenar senhas no Firestore**. Nunca expor segredos do Google Cloud ou do provedor de pagamentos no frontend.
- A publicação continua controlada pelas regras do README e do CH-site. Documentar este contrato **não** autoriza deploy ou ativação de cobrança.

## 3. Salvar e carregar — intenção funcional

- **Durante a partida:** simulação local sem chamadas repetitivas a Firestore/Cloud Run/GCS. Manter o save local e o exportar/importar JSON já existentes, inclusive compatibilidade com `lhs-save-v1`.
- **Salvar na nuvem é manual:** botão explícito do jogador; não agendar uploads automáticos sem nova aprovação de produto. Pode haver pausa breve para snapshot consistente. Mostrar claramente sucesso, erro e último save confirmado. Não apagar o save local após upload.
- **Ao entrar na conta:** backend valida UID, autoriza o GCS privado e o frontend busca o JSON do próprio usuário, valida esquema/versão, oferece restaurar a partida e continua do ponto salvo. A carteira e os itens premium vêm separadamente do Firestore.
- **Um slot principal + um backup recuperável** no início. Exemplo de chaves privadas:
  `users/<uid>/slots/main/save.json` e `users/<uid>/slots/main/backup.json`.
  A sobrescrita do principal substitui o JSON anterior; o backup é rotativo e limitado, não histórico infinito.
- O GCS oferece **pré-condição por geração** (`ifGenerationMatch`) para bloquear sobrescritas concorrentes de abas/dispositivos. Em conflito, oferecer recarregar/comparar/decidir; não sobrescrever silenciosamente.
- Para reduzir transferência pelo Cloud Run, autorizar **URL assinada por objeto e operação**, com prazo curto, origem/CORS restritos e limites de tamanho; nunca dar permissão de acesso ao bucket inteiro. A estratégia final deve considerar validação do conteúdo antes de aceitar o novo snapshot (por exemplo upload temporário + promoção controlada, caso necessário).
- Falhas de conexão não invalidam progresso local; botão de tentar de novo e recuperação de backup. Aplicar validação de versão, formato, tamanho, titularidade e migração antes de restaurar.
- Políticas de retenção, recuperação, exclusão de dados e localização/região do bucket ficam para a fase de implantação, respeitando privacidade/LGPD.

## 4. Cookies, propriedade e pagamentos seguros

- **Fonte de verdade de saldo e direitos premium: Firestore, através de operações autorizadas pelo Cloud Run.** O JSON do save pode conter IDs/posição de itens usados no salão, mas nunca concede propriedade nem aumenta saldo. Qualquer campo de Cookies em save importado é não confiável.
- **Crédito de Cookies:** usuário autenticado solicita pacote; backend fixa preço/quantia e cria pedido de ID único; pagamento por checkout hospedado (Mercado Pago com Pix/cartão é candidato); webhook autenticado é verificado no servidor, incluindo consulta de status ao provedor; só depois transação atômica no Firestore credita o saldo e grava **um** lançamento por pagamento.
- **Compra de item:** transação atômica verifica saldo suficiente, preço de catálogo no servidor, não duplicidade e concessão do direito; debita Cookies e persiste lançamento auditável e item comprado. Evitar gastos duplicados por falhas, repetição de clique ou solicitações simultâneas.
- Contemplar **webhooks duplicados, pagamentos pendentes, recusados, estornados e chargebacks**, incluindo reconciliação de créditos já gastos; jamais tratar redirecionamento do checkout como confirmação.
- Contas, saldo e compras precisam de regras de autorização isoladas por UID, rate limiting, antifraude, idempotência, logs sem segredos, chaves em gerenciador de segredos e restauração financeira auditável.
- **Validação no carregamento:** o frontend renderiza/ativa somente itens premium efetivamente autorizados para aquele UID; o cliente nunca decide sozinho a propriedade.
- Questões comerciais, reembolso, tributos, faixas etárias, dados pessoais e políticas publicadas devem ser verificadas antes de disponibilizar pagamentos em produção.

## 5. Critérios de aceite e implementação incremental

1. LHS continua abrindo e rodando sem login, mesmo offline após carregado; renderização, economia e saves locais não regrediram.
2. Salvar na nuvem exige clique, conta autenticada, gravação confirmada e leitura restrita ao próprio UID; com falha de rede não se declara sucesso.
3. JSON versionado preserva estado real, compatibilidade com partidas anteriores e restauração após fechar/reabrir; conflito entre dispositivos não destrói save recente silenciosamente.
4. Firestore contém apenas conta/direitos/ledger/metadados pequenos, enquanto o snapshot da partida está no GCS.
5. Editar o JSON local/GCS não cria Cookies nem produtos adquiridos; uma notificação repetida de pagamento não credita a mesma compra duas vezes.
6. Cookies são opcionais; jogadores gratuitos mantêm a progressão integral e não ficam impedidos de jogar ou salvar localmente.
7. Medir cobranças reais de Cloud Run, Firestore, Authentication, GCS, tráfego e provedor de pagamentos; aplicar alertas, limites e proteção de abuso. Alertas orçamentários não são teto rígido.
8. Antes de ativar cobrança: testes do fluxo Pix/cartão em sandbox, estorno, simultaneidade, carregamento mobile, segurança e privacidade.

**Sequência prevista:** adaptador local/nuvem compatível → Auth opcional + API Cloud Run → GCS manual e backup → conta/ledger no Firestore → checkout/webhook seguros → catálogo visual premium e testes de custo. **Nenhuma etapa deste contrato altera o runtime atual automaticamente.**
