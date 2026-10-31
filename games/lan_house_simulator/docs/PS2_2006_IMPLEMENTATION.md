# PlayStation 2 — integração de gameplay em 2006

## Estado entregue

PS2 integrado à loja, clientes reais, caixa, orçamento dos visitantes, navegação,
assentos, renderizador isométrico Canvas 2D, administração e salvamento. O PS1
continua em 2002, com seus próprios CDs, preços, limites e bancadas.
A data de 2006 é uma decisão de progressão do jogo.

A primeira leitura encontrou `main` em `752100b` e a PR #42 em `18f60e8`,
com dois commits de fundação e CI aprovado. Durante o trabalho, #42 e #41
(TypeScript 7) foram mescladas por outra sessão. A integração foi transportada
para `feat/lhs-ps2-2006-integrated`, baseada na `main` `2f1d70e`.
Este trabalho não mescla a nova implementação nem altera eventos anuais; a
proposta rejeitada da PR #40 não foi recuperada.

## Gameplay

- Bloqueado até 2005; loja libera a bancada em 2006, exclusivamente na campanha histórica.
- Até três PS2 além dos três PS1; todos disputam espaço físico e corredores reais.
- Compra valida posição, paredes, PCs, decoração, entrada, clientes e rotas antes de debitar.
- Os encaixes sul do PS2 ficam 0,20 unidade mais para dentro para acomodar a cadeira inteira no piso. Não há deslocamento dos PS1.
- Cinco jogos físicos: Cidade em Fuga, Arena dos Guardiões, Futsal de Bairro, Cosmos 2006 e Batida de Rua. Preço e quantidade independentes; uma cópia por bancada, até três cópias por título.
- Um jogo pode servir dois jogadores na mesma bancada. Não pode equipar duas bancadas com uma única cópia.
- Cada cliente paga uma vez no balcão. Depois caminha pela lateral, senta, joga, levanta e libera o lugar; pode seguir para compras conforme suas necessidades.
- Preferência, GPU, orçamento, preço, expediente, jogo e percurso determinam a escolha entre PS1, PS2 e PC. Grupos de PCs permanecem grupos de PCs.
- Segunda cadeira e controle opcionais; assentos e reservas separados. Upgrade e troca de mídia exigem bancada desocupada.
- Internet não é necessária. Desligar/religar, preço próprio, revisão paga e desgaste efetivo disponíveis na administração.
- Receita PS2 aparece separadamente no demonstrativo; seus jogadores não contam como PCs ocupados nem como uso/energia ativa de PC.

## Regras e balanceamento

Valores de referência de 2006; aquisição, jogos, cadeira, manutenção e energia seguem o índice da economia existente nos anos seguintes. A tarifa configurada fica sob controle do jogador, limitada ao teto anual.

| Item | Valor/regra |
| --- | --- |
| Bancada completa | R$ 980 |
| Hora inicial por jogador | R$ 4,00; passos de R$ 0,25 |
| Jogos | R$ 72 / 79 / 64 / 84 / 69, na ordem do catálogo |
| Segunda cadeira + controle | R$ 160 |
| Revisão | R$ 65, disponível a partir de 10% de desgaste |
| Desgaste | 0,025 ponto por minuto usado por jogador |
| Bloqueio para novos contratos | 100% de desgaste; sessão em andamento pode terminar |
| Energia por minuto | R$ 0,00015 ligada sem uso; R$ 0,0012 em uso, por console |

Energia entra uma única vez no acumulador da conta mensal. Posse de console
não gera receita. Reparos são despesa no momento da ação, nunca durante sessão.
A satisfação considera a tarifa capturada na contratação, mesmo após reajuste.

A auditoria reproduzível usa a semente 314 e sete dias por cenário. Em 2006,
com uma bancada dupla e um jogo, o investimento de R$ 1.212 resultou em:

| Tarifa | Sessões PS2 | Receita PS2 | Sessões PS1 | Sessões PC | Contribuição PS2 antes de contas compartilhadas* |
| --- | ---: | ---: | ---: | ---: | ---: |
| R$ 2,50/h | 76 | R$ 148,37 | 48 | 142 | R$ 75,25 |
| R$ 4,00/h | 64 | R$ 206,00 | 50 | 144 | R$ 153,27 |
| R$ 5,00/h | 64 | R$ 257,50 | 50 | 144 | R$ 204,77 |

*Desconta energia PS2, revisões pagas e reserva proporcional ao desgaste restante;
não desconta aluguel, internet, salários ou outras despesas compartilhadas.
Amostra determinística de balanceamento, não promessa de lucro. Mantido R$ 4/h
como ponto inicial conservador. Também há campanhas em 2010, 2020 e 2030 e
uma passagem real de 2005 para 2006. Nenhum cliente pago ficou preso ao fim
dessas campanhas. A validação não substitui testes extensos em várias sementes.

## Organização do código

| Arquivos/módulos | Responsabilidade |
| --- | --- |
| `sim/ps2.ts`, `consoleEnergy.ts` | Compras, catálogo, disponibilidade, cópias, tarifas, manutenção, energia e validação |
| `sim/consoleLayout.ts`, `consoleService.ts` | Geometria e escolha de sessão comuns a PS1/PS2, sem duplicar o atendimento |
| `sim/customerDecisions.ts`, `customerMotion.ts`, `customerLifecycle.ts`, `customerFlow.ts` | Caixa único, percurso, orçamento, poses, uso real e liberação |
| `sim/navigation.ts`, `layoutGeometry.ts`, `furnitureLayout.ts`, `walls.ts` | Colisões físicas e proteção das passagens durante obras e compras |
| `sim/types.ts`, `engine.ts`, `economy.ts`, `financialReview.ts` | Campos opcionais, compatibilidade, demanda, faturamento e indicadores |
| `application/ps2Port.ts`, `gamePorts.ts`, `shopActionsPort.ts` | Leituras e comandos ligados à partida corrente, inclusive após importar save |
| Portas financeiras, `presentationModels.ts`, `pcOperationsPort.ts` | Separação de atendimentos e indicadores de computadores |
| `ui/ps2Panels.ts` e composição dos painéis/controles | Loja, catálogo Canvas, preço, mídia, segunda cadeira, revisão e energia |
| `render/ps2Art.ts`, `ps2MiniGames.ts`, `scene.ts`, `actorArt.ts`, `motion.ts` | TV com cinco animações, móveis, controles/cabos, olhar, mãos e oclusão por assento |

Não há novos frameworks, imagens geradas por IA, sprites externos, modelos 3D,
backend, Firebase, pagamentos, VPS ou alterações na lista de eventos históricos.
O pequeno ajuste de `ui/gameViewport.ts` agenda redimensionamento no frame
seguinte para evitar o erro observado de ciclo do ResizeObserver no navegador.

## Saves

Campos opcionais: `ps2Stations`, `ps2Games`, `ps2HourlyPrice`, `ps2Sessions` e
`ps2Revenue`. Clientes podem ter `ps2StationIndex`, `ps2SeatIndex` e a tarifa do
contrato (`consolePaidHourly`). A versão do save permanece 1; campos ausentes
não criam compras nem mídias. `snapshotGameState`, exportação, importação e
persistência local já preservam esses campos sem copiar o formato do PS1.

Validação rejeita estações duplicadas, jogos desconhecidos, cópias negativas ou
acima do limite, mídia insuficiente, cadeiras/índices inválidos, ocupação duplicada,
contrato simultâneo de PC/PS1/PS2, compra anterior a 2006, valores monetários
inválidos, colisão física e falta de acesso. Sessão retomada não é cobrada de novo.

## Como reproduzir a validação

```bash
npm ci
npm run typecheck
npm run build
npm test
npm run audit
# Ferramenta de QA, fora das dependências de produção:
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install --with-deps chromium
npm run forge:ps2:integrated
npm run audit:ps2
node scripts/render_ps1_navigation.mjs out/ps1-regression
node scripts/render_ps1_crowded.mjs out/ps1-regression
node scripts/render_ps1_admin.mjs out/ps1-regression
```

`tests/ps2-integration.test.mjs` cobre compras atômicas, anos, convivência,
estoque, duas cadeiras, cobrança, sessões 30/45/60/90, deslocamento, orçamento,
expediente, energia, manutenção, HUD, importação e rejeição de saves adulterados.
Os testes de fundação verificam cenas determinísticas e recorte na TV.

`out/ps2-integrated/` contém capturas reais de chegada, sentar, um/dois jogadores,
levantar, saída, PS1 ao lado do PS2, jogos, ampliações visuais, loja e administração
desktop/mobile, traço JSON de gameplay e `ps2_ciclo_integrado.webm`.
O ciclo filmado usa o relógio da aplicação, caixa, motor e interpolação reais;
não inventa poses ou trajetórias. Os cinco close-ups usam clientes atendidos pelo
motor e a cena completa oficial ampliada. `forge:ps2` continua sendo o protótipo
isolado antigo e não é usado como prova de gameplay integrado.

A workflow `LHS PS2 integrated gameplay` gera esses arquivos e a regressão PS1
como artefato `lhs-ps2-integrated-gameplay`, retido por 14 dias no GitHub Actions.

## Revisão humana restante

- Testar no Android físico (aqui: Chromium desktop e mobile emulado).
- Avaliar a arte e as poses no zoom habitual e o balanceamento de longo prazo
  em outras sementes, antes de autorizar a mesclagem/publicação.

Não há implementação de PS2 deliberadamente inativa nos controles entregues.
A nova PR permanece em rascunho para revisão, sem mesclagem automática.

## Resultado local da validação

Na base `2f1d70e`, com `typescript@7.0.2`, `npm ci`, `npm run typecheck`,
`npm run build` e `npm test` concluíram: **1.611 testes, 1.602 aprovados,
9 ignorados, zero falhas ou cancelamentos**. Os 9 ignorados já existiam na base.
`npm run audit`, os scripts PS2 de gameplay/balanceamento e os três scripts
PS1 de navegação, dupla e administração também concluíram com sucesso.
Não confundir esse resultado local com o estado de uma execução futura do CI.

## Polimento de legibilidade e controles (etapa incremental)

- A tela do PS2 agora usa uma área maior do gabinete procedural; melhora a leitura dos cinco microjogos no zoom normal do salão.
- Cenas dos cinco títulos receberam contraste mais alto e o gabinete ganhou borda de vidro, iluminação discreta e LED próprio; não há imagens externas.
- A pose dos jogadores PS2 passa a atualizar as mãos por estação e cadeira (grip) sem reciclar frames da pose genérica PS1; a direção espelhada também usa âncora correta.
- Testes unitários adicionais cobrem proporção da tela, controle espelhado, cor/animação e Canvas; as regressões de gameplay, Android emulado e PS1 continuam obrigatórias no CI.
- **Ainda exige revisão humana das imagens reais geradas pelo workflow**, especialmente TV em 100%, dupla e Android físico. PR permanece em rascunho; não anunciar melhoria visual como aprovada por captura antes da revisão.
