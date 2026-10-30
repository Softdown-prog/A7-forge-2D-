# LHS — PlayStation 2 em 2006 — execução por etapas

**Decisão do criador:** introduzir o PlayStation 2 como novo equipamento jogável no ano **2006**, coexistindo com o PS1 e mantendo o estilo **100% procedural Canvas 2D**, sem imagens conceituais de terceiros. A data de 2006 é **de gameplay**, não a data histórica global de lançamento do console.

**Referência técnica:** o PS1 já está integrado ao jogo com desbloqueio em **2002** em `src/sim/ps1.ts`. Preservar esta data e todas as partidas antigas. O PS2 não substitui retroativamente nenhum console.

## Fases

### Fase 1 — fundação procedural e design de regras (neste PR)
- [x] `src/sim/ps2.ts`: ano 2006, catálogo original com cinco jogos, cotações do conjunto e dos jogos, tarifa por sessão, teto anual.
- [x] `src/render/ps2Art.ts`: TV, bancada, gabinete do console, cadeira, controle com cabo e dois assentos opcionais, tudo com geometria Canvas.
- [x] `src/render/ps2MiniGames.ts`: cinco cenas de jogos diferentes, animadas e recortadas no visor.
- [x] Testes de época, cotações, renderização não dependente de assets externos, separação PS1/PS2 e determinismo.
- [x] Script de captura visual do **protótipo** que usa os próprios renderizadores procedurais do jogo.
- [ ] Aprovação humana das capturas em 1x e em celular físico; nenhum PNG de protótipo é aprovação automática.

**Importante:** na fase 1, a bancada ainda **não aparece na loja e não pode ser comprada**. Não adicionar sistema pela metade à interface do jogador. As cotações ainda não movimentam dinheiro, não geram receita e não são estado persistido.

### Fase 2 — bancada, jogo físico e save
- [ ] Campos opcionais PS2 no `GameState` e validação rigorosa, com migração compatível de saves antigos.
- [ ] Colocação de bancada com custo real, limite e slots físicos, sem sobreposição PS1/PC/móveis.
- [ ] Aquisição de jogos PS2 distintos dos CDs PS1, inventário físico por cópia e seleção por bancada.
- [ ] Preço/hora próprio, manutenção, desgaste, energia e integrações contábeis reais.
- [ ] Catálogo na loja, edição e administração via application ports; não copiar regras de negócio para a UI.
- [ ] Testes contra compra duplicada, custos fantasmas e saves inválidos.

### Fase 3 — clientes e animações no runtime
- [ ] Seleção contextual de PS1, PS2 ou PC em função da necessidade, dinheiro, ano, vagas, jogos e caminho.
- [ ] Reserva de lugar, chegada, cobrança única no balcão, caminhada lateral, sentar, jogar, levantar, liberar cadeira, comprar mercadoria e sair.
- [ ] Dois jogadores apenas se houver segunda cadeira, espaço e rota; controle correspondente a cada mão.
- [ ] A sessão do PS2 deve usar a sua própria tarifa e não ser cancelada por queda de internet.
- [ ] Renderização da bancada na cena isométrica 2:1, oclusão correta, controle na pose sentada.
- [ ] Registros reais de atendimento/receita/satisfação, sem NPC ou dinheiro criado por um evento.
- [ ] Testes determinísticos de 30/45/60/90 minutos, fila, lotação, fechamento e recarga.

### Fase 4 — acabamento e validação final
- [ ] Cinco jogos animados visíveis na TV na cena real, cada um com linguagem própria.
- [ ] Capturas de **runtime real** desktop e mobile emulado; vídeos de ciclo completo e com dois jogadores.
- [ ] Conferir legibilidade ao zoom mínimo, oclusão das mãos, alturas de cadeira e ausência de atravessamento.
- [ ] Campanhas de longa duração a partir de 2006: procura, retorno, consumo elétrico, desgaste e rivalidade/complementaridade PS1/PS2.
- [ ] Teste manual no aparelho físico; CI verde não substitui aprovação visual.

## Contratos que não podem regredir

1. Não mudar o desbloqueio do PS1 em 2002, seus CDs, preços, estações, saves ou clientes.
2. Nenhuma imagem externa, textura de terceiro, marca em sprite copiado ou screenshot falsa. Rótulo de gameplay `PS2` é texto simples, não logomarca.
3. O backend não precisa mudar para implementar essa mecânica offline. Continuar usando Canvas/TypeScript; sem novo framework.
4. A composição no runtime deve usar o mesmo motor de movimento e os mesmos assentos/rotas do salão.
5. Preços e nomes são **hipóteses de design para balancear**, não fatos sobre valores históricos. Os cinco jogos são fictícios e autorais.
6. Novos campos de save sempre opcionais para manter partidas anteriores; toda transação precisa ser atômica e idempotente.
7. Fazer as fases em PRs pequenos com testes; não publicar nem mesclar etapa incompleta.

## Por que não apenas copiar o PS1?

O renderer e as regras de preço podem ser exclusivos por geração, mas fila, reserva, animação, atendimento e navegação devem ser **reutilizados**, não duplicados. Primeiro definir contratos claros para duas gerações; depois conectar a UI e o motor. A fase 1 protege o jogo existente enquanto preparamos o PS2.
