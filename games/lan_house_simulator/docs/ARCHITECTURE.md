# Arquitetura técnica — Lan House Simulator

## Limites

```text
games/lan_house_simulator/
  index.html, style.css, package.json, tsconfig.json
  src/
    main.ts                    bootstrap + UI + save
    sim/{types,economy,engine}.ts simulação pura, sem Canvas/DOM
    render/{isometric,scene}.ts Canvas, animações e hit testing
    ui/nineSlice.ts            skin procedural para painéis e botões DOM
  authoring/recipes/           receitas A7 (não consumidas pelo jogo em runtime)
  assets/audio/               efeitos originais aprovados, quando enviados
  docs/                       design, contratos e backlog
  scripts/                    build estático, servidor local, auditoria
  tests/                      testes em Node sobre JS compilado
```

## Renderização

Unidade lógica CH: 128×64, grade de coordenadas `(x,y)`, projeção `screenX=originX + (x-y)*64*zoom`, `screenY=originY + (x+y)*32*zoom - z*zoom`. Zoom fixo para caber na janela, sem rotação de câmera. Ordenação por profundidade aproximada `x+y`; personagens desenhados em camadas frente/atrás do balcão. O mundo NÃO usa `three.js`, WebGL nem física 3D.

A interface é DOM/CSS sobre Canvas para acessibilidade. Nove fatias são uma textura procedural de borda/miolo aplicada por CSS border-image, com cantos não deformados.

## Simulação determinística

`GameState` serializável e versionado. A função `step(state, minutes)` avança o relógio, os clientes e eventos com PRNG por seed. O desenho é consumidor passivo de estado. Cada cliente tem posição/objetivo, estado de atendimento, vaga e tempo de sessão. A cobrança ocorre ao chegar ao balcão; saída libera estação. A progressão do relógio é por tempo de jogo, não por `Date.now()`.

Persistência inicial: `localStorage` com chave versionada, leitura com falha segura e botão reiniciar. Salvar não inclui Canvas ou objetos Audio. Migração de save é tarefa futura.

## Balanço inicial (ajustável)

- Saldo R$ 850; 3 PCs; preço R$ 12/h; 45 min por sessão; dinheiro creditado no balcão.
- Receita sessão: `round(pricePerHour * 45/60)`, comissão zero na versão inicial.
- Demanda cai conforme preço sobe; indisponibilidade de internet e reputação ruim reduzem chegadas.
- Estoque inicial de refrigerantes e doces; restock consome caixa, venda de produto reduz unidades e gera margem.
- Dia de trabalho 10:00–22:00; mês de 30 dias; aluguel + link + energia e manutenção cobrados na virada mensal.
- Chuvas, falhas e inspeções entram como eventos de estado, sem animações desnecessárias.
- Política de licenças: catálogo de jogos comerciais sem licença expõe a multas; upgrade de licenças custa dinheiro e encerra esse risco.

Valores são parâmetros de balanceamento e serão refinados com playtests.

## Pipeline de arte

`brief/receita A7 -> render PNG de staging -> review 1x/2x -> teste no cenário -> aprovação -> assets/ -> catálogo JSON`.

Nunca promover arte sem revisão. O Forge não é dependência do cliente HTML5. Pelo menos uma receita simples inicial serve de piloto para o worker. Não desenhar artes finais copiando personagens de marcas registradas.

## Qualidade e concorrência

GitHub Actions pode executar jobs independentes em paralelo, sem agentes de IA embutidos. Usar arquivos dentro da pasta do jogo, gatilho restrito e artifacts nomeados; ações não fazem commit nem sobrescrevem masters. Alterações simultâneas devem usar branches isoladas ou commit atômico com verificação do HEAD; evitar conflitos com City Horizon, Magic Castle e o núcleo A7.

## Contrato de visualização da sala (revisão de validação)

A geometria do piso deve ter **espessura visível e sombra de flutuação**. A câmera vê o interior de cima sem nenhum telhado, em 2:1, e a parede dianteira é omitida para não ocultar mesas/clientes. A entrada é um marcador de soleira na borda frontal e não dá acesso a um mapa externo. `entrance(state)` permanece dentro da sala para spawn lógico. O fundo é abstrato; estado meteorológico aparece apenas em HUD e lógica econômica.

A progressão de tecnologia é dado de jogo, independente da arte: `internetTier=1/2/3` significa discada/rádio/fibra, mantendo o save V1. Evolução dos computadores Windows 98 -> 2000 -> XP -> Vista -> 7 -> 8/8.1 -> 10 -> 11 é uma tabela de planejamento, **não** propriedade de `GameState` até haver implementação de compra e migração de save.

## Renderização de personagens — acabamento procedural V1

O módulo `src/render/actorArt.ts` é um *renderer de estudo*, feito de paths e elipses Canvas 2D em coordenadas locais com âncora de pés. Não depende de imagens online e não é asset aprovado. `actorStyleFor(kind,id)` determina paleta e aparência por identidade, não por timestamp. Poses `idle`, `walking`, `sitting`, `standing-up` compartilham silhueta e rosto, com transições animadas. A orientação esquerda/direita vem do deslocamento dos waypoints, sem rotação de câmera. Fantasias são arquétipos originais. O `actorHitbox` acompanha a cabeça/ombros do proprietário para manter painel clicável.

Futuro: trocar formas por sprites A7 Forge após aprovação visual 1x mantendo a API de pose, ID, âncora e paleta, sem refazer IA ou economia. A cena continua fixa, 2:1, cutaway sem telhado/exterior.

## Revisão de enquadramento pela captura real
A placa de marca agora ocupa apenas o fundo vazio do Canvas, sem ocluir a decoração. O worker-scene passa a gerar `lhs_characters_closeup_desktop.png`, recorte ampliado do *mesmo framebuffer do jogo*, e não arte reimaginada. Cadeiras com encosto em plano vertical, rodízios e contornos mais legíveis usam a posição original do jogo. Câmera e rotas seguem inalteradas.

## Equipamentos do fim dos anos 1990: render de estudo V3

Monitores CRT continuam desenhados em `retroComputer.ts`. O desktop ilustrativo utiliza um pequeno sistema de coordenadas relativas à face do monitor, preservando a projeção isométrica; não reproduz marcas ou UI de sistemas operacionais. Máquinas de venda são um estudo de geometria 2D procedural com produtos visíveis, gaveta e painel. As janelas exibem vidro abstrato, caixilho e peitoril, não existe paisagem externa. O trabalhador de cena entrega `lhs_equipment_closeup_desktop.png`, corte ampliado do framebuffer real para revisão 1x e zoom, além dos PNGs existentes. O contrato de simulação e a câmera permanecem inalterados.

## Peças e Windows por estação

`sim/hardwareCatalog.ts` define 52 peças e oito kits; `sim/hardware.ts` resolve fichas legadas, cota instalação, verifica compatibilidade e executa transações individuais. `pcComponents` é opcional no save V1, com uma entrada por índice de PC, e acompanha as mesmas inserções de originais/anexos que GPU/Windows. `sim/era.ts` mantém Windows independente das peças e valida a instalação; `ui/hardwarePanel.ts` apresenta configuração e catálogos, reutilizando a seleção de estação das GPUs/LCDs. Renderização e posições da cena permanecem separadas dos números de configuração. Regras, parâmetros e limites estão em `docs/HARDWARE_GENERATIONS.md`.

## Contrato futuro — backend leve, GCS e Cookies (14/10/2026)

Manter o runtime atual local em HTML5/TypeScript/Canvas 2D. Para o **LHS — Lan House Simulator**, planeja-se frontend estático na Cloudflare e uma API Node.js no Cloud Run (alvo 1 vCPU, 512 MiB, instâncias mínimas 0), sem chamadas por frame/minuto de simulação. Firebase Authentication gerencia identidades; Firestore guarda conta, saldo e transações de **Cookies (biscoitos)** e os direitos aos itens; GCS privado guarda snapshots JSON por UID, gravados mediante **clique explícito** e restaurados após login. Dinheiro do jogo é separado da carteira. Validar token, acesso por UID, versões de save, conflitos de geração GCS, webhook de pagamento e transações idempotentes; JSON editável não concede Cookies nem direitos pagos. Preservar os saves locais e anteriores. Especificação canônica: [ONLINE_COOKIES_CLOUD_CONTRACT.md](ONLINE_COOKIES_CLOUD_CONTRACT.md). **Somente planejamento; sem deploy nesta etapa.**
