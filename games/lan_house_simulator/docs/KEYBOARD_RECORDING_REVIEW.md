# Gravações reais de teclado: tratamento e avaliação

Fonte autoral do criador: `assets/Convert/te1.m4a`, `t2.m4a` e `t3.m4a`. Preservar todos os arquivos originais.

## Ferramenta existente

O A7 já contém `tools/a7_audio_lab/audio_asset_worker.py`, port do CH Audio Lab do City Horizon. O workflow `Lan House - Keyboard Cleanup Review` usa essa ferramenta com filtros de altas/baixas frequências (145–8000 Hz), redução espectral de ruído (`afftdn`, 13 dB) e um gate leve entre transientes. A saída OGG é exclusiva de revisão: `lhs-keyboard-cleaned-review`, sem modificar nenhum asset aprovado.

## Gravações avaliadas

As medidas abaixo foram coletadas nas versões OGG processadas pelo workflow em 13/10/2026, mediante análise de RMS em janelas de 10 ms. São indicadores objetivos de contraste, não uma decisão auditiva:

| Take | Duração | Ruído de fundo P20 | Intensidade P90 | Contraste |
| --- | ---: | ---: | ---: | ---: |
| te1 | 6,44 s | -62,3 dBFS | -38,4 dBFS | 23,9 dB |
| t2 | 8,23 s | -59,7 dBFS | -39,9 dBFS | 19,8 dB |
| t3 | 9,02 s | -56,1 dBFS | -35,6 dBFS | 20,5 dB |

`te1` é a primeira candidata por apresentar maior contraste entre transientes e ambiente. `t2` e `t3` oferecem gravações mais longas para variedade, mas devem ser avaliadas pela escuta.

A montagem de audição de aproximadamente 10,8 s compara trechos de 3,3 s dos três áudios, com 0,3 s de pausa entre eles. Esses trechos receberam normalização **apenas para audição**, e não representam a futura mixagem de volume do jogo.

## Limites e promoção

A ferramenta atenua ruído estacionário e intervalos sem digitação. Vozes, música ou outros sons que coincidem com as teclas **não podem ser removidos com garantia** usando esse método. Não integrar gravações ao runtime até aprovação auditiva; manter o teclado procedural atual e os sons aprovados de mouse e dinheiro. Depois da aprovação, é possível alternar determinísticamente entre as três variações com ganho inferior ao clique do mouse e ao som de caixa.
