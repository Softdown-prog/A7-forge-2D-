# Backlog — visão sem perda de escopo

## Fase A — estrutura e recorte jogável
- [x] Pasta isolada, documentação de produto, contratos e painel inicial.
- [x] TypeScript + Canvas 2D fixo com cenário dimétrico, balcão, dono e clientes.
- [x] Protótipo de fluxo de clientes, PCs, finanças, incidentes e save.
- [x] Pool de 3 workers de CI com validações e piloto de arte.
- [ ] Teste visual real em browsers móveis e desktop e ajuste de escala.
- [ ] Aprovação visual dos sprites substituindo placeholders.

## Fase B — Forge e personagens
- [ ] Design original de dono/balcão, mesa/monitor/cadeira, refrigerante, doce e prateleiras de balas/paçocas/biscoitos/salgadinhos; sprites 2D separados com âncora.
- [ ] Animações direcionais de caminhada; sentar/usar PC (telas piscando), levantar e sair; identidade travada.
- [ ] Fantasias originais: palhaço, vampiro, monstro costurado, coelho e mascotes genéricos; sem cópia de IPs.
- [ ] Controle de oclusão e profundidade entre balcão, dono, mesa, cadeira e cliente.

## Fase C — economia tycoon
- [ ] Mais linhas de estoque/fornecedores: refrigerantes, doces, balas, paçocas, biscoitos e salgadinhos, preços e qualidade por fornecedor.
- [ ] Cliente VIP, conforto, humor, fila, avaliações e reputação com efeitos consistentes.
- [ ] Melhorias no computador, rede, energia; desgaste/consumo por cliente e relatórios financeiros.
- [ ] Aumento de preço reduz procura; promoções aumentam circulação, desgaste e custos, sem fabricar receita.
- [ ] Multa por jogos comerciais sem licença e opção de regularizar; balanço cuidadoso do evento.

## Fase D — expansão e polimento
- [ ] Nova sala anexada, montagem física das mesas/PCs com colisão/ocupação e rotas internas.
- [ ] Aluguel, link, energia, manutenção, eventual equipe; cobrança por mês do jogo.
- [ ] Chuva fora da cena como sinal econômico e instabilidade de internet; variedade de eventos.
- [ ] Importar efeitos gravados pelo criador: moedas, líquido, vendas, alertas.
- [ ] Menu completo, opções, som, acessibilidade, suporte touch, save versionado, publicação estática.

## Regra de pronto

A tarefa só recebe status concluído se código + testes + visualização em tamanho de jogo estiverem consistentes. CI verde não significa arte aprovada. Não substituir dois objetos aprovados para refazer o terceiro. 

## Próxima validação visual (restrita)
- [x] Definir plataforma 2:1 suspensa, telhado omitido, frente recortada e soleira sem exterior.
- [x] Documentar progressão de conexão discada -> rádio -> fibra, com rótulos dos níveis existentes.
- [ ] Conferir captura real do runtime em navegador no tamanho 1x, sem confundir com a maquete de validação.
- [ ] Revisar profundidade/oclusão do balcão, telas CRT e ponto de chegada dos visitantes, antes de novos assets.
- [ ] Depois: evolução de PCs Windows 98 -> 2000 -> XP -> Vista -> 7 -> 8/8.1 -> 10 -> 11, implementada por upgrade isolado e com custo real.

## Etapa de circulação (12/10/2026)
- [x] Corrigir sintaxe TypeScript do piso suspenso que falhou no CI.
- [x] Trajeto interno por corredor com waypoints determinísticos entre entrada, balcão, estação, venda e saída.
- [x] Separar transições de sentar/usar/levantar e manter reserva do computador durante a animação.
- [x] Adicionar testes de waypoints, ocupação e liberação da estação.
- [ ] Validar fluxo visual no navegador via artifact do GitHub Actions antes de trocar placeholders por sprites definitivos.

## Validação retro/CRT (12/10/2026)
- [x] Estudo procedural 2D de mesa, gabinete, teclado, cadeira e monitor CRT, sem logos ou imagens externas.
- [x] Corrigir posições dos PCs de expansões para não extrapolarem o piso.
- [x] Preparar screenshots reais do Canvas desktop e mobile via worker de cena e artifact de revisão.
- [ ] Aprovar a composição visual por PNG antes de substituir placeholders por PNGs finais do A7 Forge.
