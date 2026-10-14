# Revisão das gravações de refrigerante (13/10/2026)

Fontes originais: duas gravações feitas pelo criador sob `games/lan_house_simulator/assets/Convert/`,
identificadas como `7 de out. 17.26​.m4a` e `7 de out. 17.27​.m4a`.

Execute o workflow **Lan House - Vending Audio Cleanup Review**. Ele usa o A7 Audio Lab
(já portado do CH Audio Lab), FFmpeg e processamento de sinais para gerar:
- `vending_01_completo.ogg` e `vending_02_completo.ogg`: gravações inteiras com tratamento conservador;
- `vending_01_foco.ogg` e `vending_02_foco.ogg`: trechos de até quatro segundos com maior energia transiente, gate leve e fades;
- `refrigerante_comparacao.ogg`: os dois trechos curtos separados por uma pausa;
- `report.json`: análises e proveniência.

**Nada é promovido automaticamente ao jogo.** A receita de refrigerante anterior havia sido
reprovada pelo criador; os novos sons requerem escuta e aprovação para integrarem o runtime.
O tratamento reduz ruído estacionário, mas não garante remover vozes ou outros ruídos que
coincidam temporalmente com os impactos de interesse.

Use o arquivo de comparação para avaliar os dois sons. Escolher qual efeito de lata é melhor
é decisão auditiva, não apenas pelos números do relatório.
