# Correções verificadas no A7 Forge 2D

Baseline avaliado: `a38482d`. A suíte completa revelou **161 testes aprovados e
8 falhas**, enquanto o workflow executava apenas uma seleção dos módulos. As
falhas incluíam assertivas de receitas aposentadas, referências a arquivos
ausentes e um retorno incompleto no exportador de cercas.

| Ponto | Comportamento anterior | Correção |
| --- | --- | --- |
| Acabamento RGBA | O unsharp e o contraste global liam RGB de áreas transparentes. Uma borda verde `(90,130,70)` virava `(108,156,84)` com fundo invisível preto ou `(57,156,33)` com magenta. | Vizinhança e referência de contraste ponderadas por alpha. A borda plana conserva `(90,130,70)` e fontes com RGB oculto diferente produzem o mesmo resultado. Alpha permanece idêntico. |
| Espaçamento de pincéis mapeados | Campos e distância eram verificados antes do deslocamento dinâmico. Uma receita posicionava 12 pinceladas sobre um único centro, apesar de pedir distância mínima de 8 px. | Verifica distância, bounds, canvas, densidade e exclusão no centro final; registra esse centro no spatial hash. A mesma receita coloca uma pincelada e informa saturação, sem fingir atender as 12 posições. |
| Escolha de reparo | Uma média melhor podia esconder piora numa vista ou uma nova falha de clipping. | Comparação por vista e por gate. Rejeita regressão de score acima de 0,05 e gates que antes passavam; aceita ganho mensurável ou resolução de gate com score estável. Registra a decisão e suas razões. |
| Grafo V2 genérico | O worker exigia distribuição por campos mesmo para canvas e formas vetoriais válidas. | Confere se o relatório corresponde aos nodes realmente usados. Formas genéricas podem ser exportadas sem inventar campos. Portas obrigatórias e parâmetros malformados são rejeitados antes da execução. |
| Instalação | O wheel continha zero pincéis PNG e não incluía o aviso da adaptação libmypaint. | Inclui todos os dez pincéis e o aviso; smoke test instala o wheel fora do checkout e renderiza o piloto de campos. |
| Operação | Grafo e planner exigiam chamadas Python internas nos exemplos do CI. | CLI público `draw-graph` e `plan-plant`, com o alias `a7-forge-2d`. |
| Cerca | O retorno do exportador não expunha anchor, módulos e demais campos presentes no JSON. A sombra do portão tinha a mesma intensidade da cerca. | Retorno consistente com o metadata e sombra mais leve no espaço de passagem, preservando a ausência de guia de pedra no portão. |
| Fontes e regressões legadas | Testes referenciavam receitas removidas e o master WEST ausente; uma revisão podia escrever três direções antes de falhar. | Testa as gramáticas atuais, fontes da mangueira existentes e um fixture procedural de acabamento. Mantém testes dos três masters autorados e exercita WEST com um fixture diagnóstico. Revisão completa faz preflight de todas as fontes. |

## Comparação do piloto real

O Ipê do Art Planner foi renderizado antes e depois, mantendo seed, receita,
estrutura, anchor e canvas. O crítico manteve score **97,60** e aprovação de
todas as quatro vistas. Os canais alpha foram idênticos byte a byte nas quatro
vistas; o acabamento mudou apenas as cores. Isso verifica estabilidade técnica,
não comprova superioridade artística ou aprovação de produção.

Os testes de seleção incluem uma média que sobe de 80 para 92,5 enquanto uma
vista cai para 70: o novo gate rejeita esse reparo. Outro caso introduz clipping
com scores maiores e também é rejeitado.

## Validação

**185 testes passaram** após as correções. O wheel final foi instalado em um
diretório temporário, importado com Python isolado e executado fora do checkout.
Os dez pincéis foram abertos como RGBA com alpha visível, e o grafo de campos
produziu um pacote `review_ready`. O CI executa essas mesmas verificações e os
quatro pilotos de render.

## Limites

As métricas do crítico continuam focadas em continuidade, preenchimento, madeira,
equilíbrio e clipping. Ainda não medem repetição perceptual nem reconhecem todos
os requisitos artísticos de uma espécie. `criticPassed` e `review_ready` não são
aprovação de arte. A revisão em escala de jogo continua necessária.

O master artístico WEST do personagem legado não está neste repositório. Nenhuma
fonte artística foi fabricada para encobrir essa ausência. O wheel portátil
contém o núcleo e seus pincéis; bibliotecas de autoria e masters requerem o
checkout, conforme o README principal.
