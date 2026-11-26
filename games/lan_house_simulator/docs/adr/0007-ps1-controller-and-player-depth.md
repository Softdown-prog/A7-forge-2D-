# ADR 0007 — Controles e profundidade da bancada PS1

Na bancada dupla, deslocar a ponta do cabo a partir da cadeira fazia
o primeiro cabo terminar fora do console. Ambos os controles eram
desenhados por último, inclusive quando o jogador estava de costas.

A frente da carcaça fornece duas portas fixas. A posição da TV define
a direção do jogador e a âncora do controle no colo. A projeção da
âncora orienta as mãos e determina se o tronco fica à frente do controle.
Cada pose de mãos com âncora própria usa o desenho vetorial naquele
quadro. As capturas do Forge recebem a mesma geometria.

A regressão confere as posições dos dois controles e registra as duas
cadeiras no Canvas do jogo em desktop e celular emulado.
