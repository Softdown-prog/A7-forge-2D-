# Peças geracionais e configuração individual — 14/10/2026

O painel **Administrar → Computadores** exibe o Windows instalado/licença, CPU (frequência, núcleos, arquitetura e socket), RAM total/tipo, HD/SSD/NVMe, placa-mãe (socket, limite de RAM e conexões), fonte, GPU e monitor da estação selecionada. As linhas de todas as máquinas também mostram Windows, CPU, RAM, armazenamento e desgaste. A seleção de PC acompanha as abas de computadores e GPUs.

## Catálogo da campanha

São **52 peças**, distribuídas em nove CPUs, 18 conjuntos de RAM, 12 volumes de armazenamento, seis placas-mãe e sete fontes. O ano de lançamento é conferido pela interface e pela API de compra no minuto exato da virada. Produtos, valores e consumo de peças são parâmetros fictícios do simulador, inspirados nas gerações de tecnologia; não são especificações de marcas comerciais.

Oito kits de plataforma oferecem caminhos de migração. Peças individuais permitem variações entre esses degraus, como Octa AM4 de 2020, RAM DDR4 de 64 GB e NVMe de 4 TB.

| Kit / ano | CPU | RAM | Armazenamento | Placa-mãe | Fonte | Preço base |
| --- | --- | --- | --- | --- | --- | ---: |
| Inicial / 1998 | 350 MHz, 1 núcleo | SDRAM 64 MB | HD IDE 4 GB | Slot 1, até 512 MB | 350 W | Já instalado |
| Bairro / 2000 | 800 MHz, 1 núcleo | SDRAM 128 MB | HD IDE 10 GB | Slot 1, até 512 MB | 350 W | R$ 240 |
| Turbo / 2003 | 2,4 GHz, 1 núcleo | DDR 512 MB | HD IDE 40 GB | 478, até 2 GB | 400 W | R$ 480 |
| Turbo / 2005 | 3,0 GHz, 1 núcleo | DDR 1 GB | HD SATA 160 GB | 478, até 2 GB | 450 W | R$ 1.020 |
| Duo / 2008 | 2,4 GHz, 2 núcleos | DDR2 2 GB | HD SATA 320 GB | 775, até 8 GB | 500 W | R$ 1.420 |
| Quad / 2012 | 3,2 GHz, 4 núcleos | DDR3 8 GB | SSD SATA 512 GB | 1155, até 32 GB | 650 W | R$ 2.150 |
| Estúdio / 2017 | 3,6 GHz, 6 núcleos | DDR4 16 GB | SSD SATA 1 TB | AM4, até 64 GB | 850 W | R$ 2.890 |
| Arena / 2024 | 4,2 GHz, 8 núcleos | DDR5 32 GB | NVMe 2 TB | AM5, até 128 GB | 1.000 W | R$ 4.230 |

O Turbo 2003 custa R$ 720 ao partir diretamente da CPU inicial, incorporando os dois degraus CRT anteriores (240 + 480). A RAM representa a capacidade total instalada; armazenamento é um volume principal, não uma soma de discos. Compras individuais substituem a peça e cobram seu valor integral, sem revenda.

## Instalação e compatibilidade

Uma compra afeta somente a estação escolhida, debita caixa/despesas após todas as verificações e preserva Windows/licença, GPU, monitor, desgaste e geometria da estação. Reservas, clientes sentando/usando/levantando e reparos em andamento bloqueiam a instalação. Peças inferiores, duplicadas, antecipadas, desconhecidas ou sem caixa são rejeitadas sem mudar a partida.

CPU e placa-mãe devem compartilhar socket; RAM deve usar o tipo e respeitar o limite da placa; armazenamento exige a conexão correta. Uma migração de socket/tipo de RAM utiliza kit, para trocar os componentes juntos sem uma configuração intermediária inválida. Kits preservam CPU/RAM/disco/fonte superiores quando compatíveis. Se a RAM atual for maior que a do novo kit e mudar de tipo, a cotação procura memória nova compatível de capacidade suficiente, cobra a diferença adicional e só libera quando disponível. RAM já possuída e retida não recebe esse adicional. Uma plataforma mais antiga ou que reduza o desempenho da CPU é rejeitada.

A potência necessária soma CPU, placa-mãe, RAM, disco e GPU, adiciona 25% de margem e arredonda para 50 W. As GPUs existentes recebem valores de carga do simulador (40–150 W), preservando a compatibilidade dos PCs CRT antigos. O catálogo de GPU mostra a fonte exigida na configuração selecionada e bloqueia potência insuficiente. A fonte é capacidade disponível: aumentar de 350 para 1.000 W sozinho não aumenta consumo nem satisfação.

## Windows e legado

Windows 98, 2000, XP e Vista permanecem; Windows 7 (2009), 8 (2012), 10 (2015) e 11 (2021) passam a ter licença/instalação individual. Os cartões mostram ano, preço, estado e requisitos faltantes. CPU, RAM, espaço, arquitetura e plataforma moderna são verificados antes da compra. Instalar um sistema não troca as peças; comprar peças não troca o Windows.

Os requisitos são limites simplificados da campanha, não uma emulação completa de drivers e BIOS. Para Windows 11, a base de referência é [Microsoft: especificações](https://www.microsoft.com/pt-br/windows/windows-11-specifications): 1 GHz, dois núcleos, 64 bits, 4 GB de RAM, 64 GB de armazenamento, UEFI/TPM 2.0 e DX12. Plataformas fictícias AM4/AM5 modelam essas capacidades; não há afirmação de suporte real para um processador comercial específico. O suporte de drivers antigos e o barramento de encaixe de GPU são abstraídos.

Saves V1 sem `pcComponents` usam os três presets CRT correspondentes a `pcTiers`, sem cobrança ou atualização automática. Cada entrada nova é uma ficha de cinco IDs ou `null` para legado. A validação rejeita IDs, estrutura, encaixes, potência e requisitos de Windows inválidos nas fichas novas. Os níveis CRT continuam determinando a aparência antiga e a manutenção; upgrades por peças passam a fornecer bônus de conforto pela configuração. Exportação/importação preserva PCs mistos e insere/desloca fichas corretamente quando se compra PC original antes dos anexos.

## Simulação e verificação

Nas máquinas sem ficha nova, a satisfação e a energia continuam com as fórmulas existentes. Nas fichas novas, conforto pondera CPU/RAM/disco e permanece limitado a 0,24; o consumo ocioso usa a carga das peças, com as parcelas de GPU, uso em sessão e tarifa anual existentes. Fonte não é tratada como consumo. Os valores ainda precisam de auditoria longa de amortização; as pesquisas anteriores de CRT/GPU/LCD foram preservadas e não são resultados para este novo catálogo.

O relatório de receita por estação recebido da main foi preservado. Sua coluna de energia continua sendo o rateio contábil da energia global entre os PCs, não uma leitura individual de watts; os upgrades não zeram sessões, receitas ou minutos já registrados.

```sh
npm test
npm run audit
node scripts/verify_hardware_ui.mjs out/hardware
node scripts/capture_lcd_generations.mjs out/hardware/lcd-regression
```

Foram aprovados **207 testes ativos** após integrar as mudanças de receita por estação recebidas da main, sem falhas. As três auditorias extensas de economia continuam optativas. Os 14 testes novos cobrem lançamentos de todas as peças/kits, compras individuais e migrações, transações atômicas, preservação, potência, Windows, saves, anexos e três dias completos de atendimento/contabilidade do motor.

No Chromium, seis cenários (2000/2024 × 1440/414/360) compram pelo controle/SVG real, atualizam apenas PC 02, mantêm vizinhos em Windows 98, testam requisitos, recarregam o save e verificam foco e largura do painel. A regressão dos LCDs também passou nas 240 combinações Canvas e nas compras/recargas das três larguras. Imagens QA em `out` são diagnósticos locais; a inspeção em telefone físico permanece pendente.
