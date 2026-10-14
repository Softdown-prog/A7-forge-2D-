# Circulação entre salas sob lotação — 14/10/2026

O cenário de estresse revelou um bloqueio que não aparecia nos testes isolados: a presença de qualquer divisória retirava a saída lateral do caixa. Clientes já cobrados retornavam pelo centro da fila, reservavam computadores e não chegavam aos assentos. Desvios locais também podiam oscilar em aglomerações junto às máquinas e à porta.

## Cenário reproduzível

`scripts/circulation_scenario.mjs` cria a mesma fixture para os testes e a gravação:

- Capital inicial de teste: R$ 10.000, explicitamente diferente da partida normal de R$ 850.
- Duas expansões ao norte, uma a leste e uma a oeste, compradas pelas APIs reais.
- Vinte segmentos de divisória, com três deles convertidos em portas pagas.
- Quatro PCs dos anexos instalados pelas APIs reais; os três PCs iniciais começam quebrados para obrigar o uso dos anexos.
- Oito clientes iniciais em posições separadas da fila; entradas posteriores seguem a demanda normal, sem aumentar sua taxa.
- Preço R$ 8/h, reputação inicial 95, jogos licenciados. Nenhuma sessão começa paga ou em uso: pagamento, deslocamento, uso, compra e saída acontecem pela simulação.

## Correções

As interseções incluem as extremidades dos passos e dos segmentos de parede. Isso fecha as brechas nas emendas e impede que o ajuste final de posição atravesse uma divisória. Funcionários usam a mesma checagem geométrica.

A saída lateral do caixa permanece disponível quando seus segmentos estão livres. Se o desvio local não aproxima o visitante do waypoint, uma busca na grade considera os corpos atuais, bancadas, máquinas, móveis de piso e paredes, e procura um caminho até o destino final. Os waypoints são percorridos pelos mesmos subpassos com colisão do motor. Esta busca é um recurso de recuperação de congestionamento; não substitui todo o planejamento inicial de móveis/estações.

A soleira precisa estar livre antes de surgir um novo cliente. Isso elimina sobreposições criadas pela entrada enquanto outro visitante está saindo.

## Comparação por seis horas de jogo

A versão anterior foi recompilada a partir de `e271d371e780fdee62dec266b64745c86bffb545` e executada com a mesma fixture, sem alterar sementes, preços ou demanda.

| Semente | Atendimentos antes | PCs dos anexos usados antes | Saídas antes | Atendimentos depois | PCs dos anexos usados depois | Saídas depois | Compras depois |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 20 | 4 | 0 | 0 | 15 | 4 | 20 | 11 |
| 1998 | 4 | 0 | 0 | 17 | 4 | 25 | 12 |
| 72421 | 4 | 0 | 0 | 16 | 4 | 20 | 9 |

Todas atingiram 14 visitantes. A menor distância entre corpos ficou acima de 0,43 tile, e o caixa foi conferido minuto a minuto contra receita e despesas. Os testes também verificam passagem por paredes fechadas, uso dos quatro anexos e continuidade de compras/saídas.

Esses números medem recuperação da circulação neste cenário. Não representam lucro de uma campanha normal nem aprovação final do balanceamento econômico.

## Inspeção do navegador

`scripts/capture_circulation.mjs` abre a aplicação compilada, carrega a fixture após 35 minutos de aquecimento e clica em Continuar. Depois disso, o `requestAnimationFrame` de `src/main.ts` conduz a simulação normalmente, a quatro minutos de jogo por segundo. O script não altera posições de atores durante a filmagem.

- Desktop: Chromium, viewport 1280 × 850, escala 1.
- Mobile: Chromium com emulação touch, viewport 414 × 920, escala 1; não é teste em aparelho físico.
- Gravação contínua de 48 segundos de execução, além do trecho de abertura/captura; MP4 H.264, sem áudio.
- Save produzido pela aplicação avançou do minuto 35 ao 224, com 12 atendimentos e seis compras.
- Capturas inspecionadas no início e durante a gravação: clientes nas salas, uso dos PCs, circulação pelas portas e saída. Sem erro de página ou overflow horizontal.
- Arte permanece procedural e sujeita à aprovação do criador; esta inspeção encerra a validação técnica de circulação no cenário, não aprova sprites finais.

O worker de cena gera `lhs_circulation_runtime.mp4`, `lhs_circulation_runtime.json` e capturas desktop/mobile no artifact `lhs-visual-validation`.

## Reproduzir

```bash
cd games/lan_house_simulator
npm install
npm test
npm run audit
npm install --no-save playwright@1.56.1
npx playwright install --with-deps chromium
node scripts/capture_circulation.mjs out/validation
```

A gravação requer `ffmpeg` no PATH e a porta local 4173 livre. Validação local: 135 testes aprovados, auditoria estática aprovada e captura contínua desktop/mobile concluída.
