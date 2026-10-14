# Progressão tecnológica e licenças — Lan House Simulator

A partida começa em **1998**. Cada ano do jogo tem 360 dias de 720 minutos de jogo. O calendário mostrado na interface e as restrições econômicas consultam o mesmo `gameYear()`, evitando que a data da UI e o desbloqueio fiquem diferentes.

## Internet
| Tecnologia | Ano mínimo | Custo de evolução |
| --- | ---: | ---: |
| Discada (inicial) | 1998 | incluída |
| Via rádio | 2002 | R$ 250 |
| Fibra óptica | 2007 | R$ 500 |

Os upgrades são sequenciais. Em 1998 o jogador não consegue comprar fibra nem por chamada direta à função de economia. As mensalidades continuam calculadas com o nível atual do contrato.

## Hardware
O PC começa no nível 1. Evolução para nível 2 é liberada em 2000 (R$ 240 por PC), e para nível 3 em 2003 (R$ 480 por PC). Comprar um PC novo não inclui automaticamente as atualizações de hardware.

## Sistemas operacionais e licenciamento
| Sistema | Disponível em | Licença por computador |
| --- | ---: | ---: |
| Windows 98 | 1998 | R$ 120 |
| Windows 2000 | 2000 | R$ 180 |
| Windows XP | 2001 | R$ 260 |
| Windows Vista | 2007 | R$ 350 |

A aba **Windows / Licenças** é separada da aba de hardware. Cada licença é uma despesa individual por PC, com controle de caixa, persistência no save e mensagem de erro antes do lançamento. O computador inicial mostra Windows 98 pré-instalado, mas a licença ainda precisa ser regularizada; a licença do catálogo de jogos permanece outro gasto independente.

## Compatibilidade
Os campos `pcWindows` e `pcWindowsLicenses` são opcionais nos saves anteriores. Sem eles, cada estação exibe Windows 98 e começa sem licença individual registrada. Os upgrades obtidos em partidas antigas são preservados, mas novas compras passam pelos bloqueios anuais. Ao inserir PCs entre as máquinas existentes e os anexos, os dois vetores de licenças são deslocados junto com `pcTiers` e `pcWear`.

## Evolução futura
O catálogo central em `src/sim/era.ts` permite adicionar novas tecnologias e despesas por época sem espalhar datas pela interface. Datas de internet são **decisões de balanceamento do jogo**, não afirmações de disponibilidade uniforme em todo o Brasil na época.
