# ADR 0005 — Build única do jogo com Angular e Canvas

O build isolado era o último consumidor da fixture React. Testes de navegador
e ferramentas que iniciavam esse build exercitavam uma interface diferente
daquela entregue no site.

`npm run build` compila o HUD Angular em AOT e o motor Canvas em TypeScript,
com `dist/index.html` como documento do jogo e `dist/__angular/` para o
bundle da interface. Os builds de site e os testes de navegador usam essa
mesma saída. O site aplica suas próprias revisões de cache no empacotamento.
A UI Angular monta os controles antes de carregar o motor.

Foram retirados o código JSX, o pacote de dependências isolado e o seletor
do runtime antigo. As verificações de entrega rejeitam o bootstrap anterior e
os lockfiles do jogo e da UI são verificados contra a reintrodução das
dependências. As chaves de save, o formato de dados e os comandos do motor
continuam os mesmos. O caminho `build:site:legacy` continua disponível para
regressões do site institucional estático e já empacota o jogo Angular.
