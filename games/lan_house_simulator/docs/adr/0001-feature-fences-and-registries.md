# ADR 0001 — Independência por funcionalidade e registro de arte

**Aplicação:** Lan House Simulator, baseado nas proteções de crescimento do Terrania (ADRs 0045 e 0048).
**Escopo:** somente `games/lan_house_simulator`, sem mudança de mecânicas, saves ou deploy.

## Problema e decisão

O jogo já tem motor puro, portas de aplicação, renderizadores individuais e arte separada.
Sem um portão automático, módulos vizinhos poderiam voltar a importar o código uns dos outros, exigindo alterações em cascata.

1. As famílias `render/posters/`, `render/retail/`, `render/computers/` e `render/actors/` não importam outra família diretamente. O código comum fica nos adaptadores neutros de `render/` ou nos primitivos compartilhados da própria família.
2. Aparências de personagens não importam aparências irmãs. Primitivos, rig e contratos próprios continuam compartilhados.
3. Desenhos individuais de pôster não importam outros desenhos individuais; entradas no registro central podem importá-los.
4. Cada história em `sim/stories/definitions/` não importa outra definição. Tipos e construtores compartilhados ficam na pasta-pai.
5. O cadastro `render/posters/registry.ts` declara um pintor por pôster; IDs duplicados provocam erro, e `posterArt.ts` consome apenas `posterFor`. `POSTER_KINDS` continua exportado com a mesma ordem.
6. `tests/feature-boundaries.test.mjs` usa o parser TypeScript para ler imports normais, de tipos, reexports, imports dinâmicos literais e imports sem nome. `npm test` verifica todas as fontes. Testes artificiais provam que violações são detectadas.

## Por que não introduzir limites aleatórios

O Angular já define um orçamento de tamanho por configuração. Não são impostos limites novos de CPU, RAM, quantidade de arquivos ou complexidade por suposição. Um futuro orçamento de bundle ou de operações Canvas deve partir de medições da compilação real e de testes em navegador, com folga explícita e justificativa documentada.

## Como estender

Quando uma nova peça não couber na família existente: criar arquivo de responsabilidade única, registrar no agregador, acrescentar teste de contrato e validar em Node/Chromium. Se duas famílias precisarem da mesma função, extraí-la para um módulo compartilhado neutro em vez de criar importação lateral. Atualizar este ADR quando uma fronteira intencionalmente mudar.

## Estações de console

O `SceneRenderer` também deixou de conhecer os detalhes individuais de PS1 e PS2. Cada geração prepara suas entradas ordenáveis por profundidade em `scene/stations/ps1.ts` e `scene/stations/ps2.ts`; `scene/stations/registry.ts` registra as duas com detecção de IDs duplicados. A cena consome apenas `collectConsoleEntries`. O teste `scene-console-registry.test.mjs` verifica os dois produtores, ordem e ligação, sem mudar jogabilidade ou posição das bancadas. O portão de arquitetura também impede que PS1 importe PS2 (ou o contrário) dentro desta pasta.

## Portas agrupadas da aplicação

O `gamePorts.ts` preserva a API pública e a ordem das chaves, mas não instancia mais diretamente seis portas de PS1/PS2 nem quatro relatórios financeiros. Estas responsabilidades ficam em `src/application/portGroups/consolePorts.ts` e `financeReportsPorts.ts`. Ambos recebem apenas o mesmo `getState` vivo; nenhum guarda a partida nem introduz DOM/Canvas. O teste `tests/game-port-groups.test.mjs` compara as interfaces observáveis e confirma que a substituição da partida atualiza as portas sem recriar o grupo. A mudança não altera contabilidade, preços, save ou jogabilidade.

## Composição de preços e promoções

O terceiro grupo `src/application/portGroups/pricingPorts.ts` compõe seis portas independentes: campanha promocional, insights, preço por hora, preços de varejo, balcão e comandos de reajuste. `gamePorts.ts` somente importa e conecta o grupo, mantendo a ordem e os tipos públicos. Cada porta recebe o mesmo `getState` ativo; nenhuma armazena o estado ou chama o motor ao ser construída. Os contratos de `tests/pricing-port-groups.test.mjs` e os testes de fronteira garantem troca de partida, DTOs, comando de preço, ausência de DOM e composição correta. Não altera valores, preços ou regras econômicas.
