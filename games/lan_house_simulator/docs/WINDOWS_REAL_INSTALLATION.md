# Instalação progressiva do Windows (tempo real)

Cada compra de licença inicia uma instalação real por PC. A duração é independente do tempo acelerado da campanha:

| Windows | Minutos reais |
|---|---:|
| 98 | 10 |
| 2000 | 20 |
| XP | 30 |
| Vista | 40 |
| 7 | 50 |
| 8 | 60 |
| 10 | 70 |
| 11 | 80 |

## Mecânica
- Tony deve desligar a estação e deixá-la sem clientes antes de comprar o sistema compatível.
- O valor da licença é debitado **uma única vez** no início.
- O Windows anterior continua registrado até a conclusão; não é possível iniciar uma segunda instalação nem ligar, utilizar, reparar ou atualizar o PC enquanto o trabalho estiver em andamento.
- Cada estação tem seu próprio progresso e prazo real. No término a nova versão e licença são ativadas, mas a estação permanece **desligada**, aguardando o jogador.
- A interface de manutenção e licenciamento exibe nome do SO, porcentagem, barra nativa `progress` e minutos restantes.
- Um `startedAtMs` e um `finishedAtMs` ficam no save; reabrir a página ou importar o arquivo não reinicia o contador. A conclusão é idempotente e os saves sem campo novo continuam aceitos.
- O calendário do jogo não avança ao carregar o save fechado.
- O relógio utilizado nesta versão é o horário do dispositivo (single-player), não um serviço remoto anti-manipulação. Se o jogador mudar a hora do dispositivo, isso pode afetar as conclusões.

## QA
`npm run typecheck`, `npm run build`, `node --test tests/windows-real-installation.test.mjs tests/era.test.mjs tests/gpu-games-2005.test.mjs`, Chromium através de `node scripts/verify_hardware_ui.mjs` e workflows existentes (inclusive Angular e SAC). No Chromium, o relógio virtual é adiantado durante o teste para exercitar 80 minutos em segundos, sem alterar a duração real no jogo.
