# GPU: novas gerações 2015–2030

A expansão acrescenta **oito GPUs fictícias** para cobrir o restante da campanha do Lan House Simulator, sem retirar as cinco placas de 2005 a 2013. Preços e potência são hipóteses internas de balanceamento, não especificações de produtos comerciais.

| Ano | GPU | ID | Preço (R$) | Bônus satisfação | Consumo relativo | Potência simulada |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 2015 | PixelForce 960 | `gpu15` | 2700 | 0.155 | 0.86 | 165 W |
| 2017 | PixelForce 1070 | `gpu17` | 3300 | 0.170 | 0.97 | 180 W |
| 2019 | PixelForce 2070 | `gpu19` | 4050 | 0.185 | 1.08 | 200 W |
| 2021 | PixelForce 3070 | `gpu21` | 4800 | 0.200 | 1.20 | 220 W |
| 2023 | PixelForce 4070 | `gpu23` | 5650 | 0.215 | 1.32 | 245 W |
| 2025 | PixelForce 5070 | `gpu25` | 6600 | 0.230 | 1.43 | 270 W |
| 2028 | PixelForce 6080 | `gpu28` | 7850 | 0.245 | 1.55 | 300 W |
| 2030 | PixelForce 7080 | `gpu30` | 9250 | 0.260 | 1.68 | 330 W |

## Compatibilidade e regras

- Os primeiros cinco IDs (`gpu05` a `gpu13`) mantêm os seus preços, bônus e consumo originais, e os saves antigos continuam representando exatamente as mesmas placas.
- O modelo só fica disponível no ano correspondente. A compra exige PC livre e desligado, caixa suficiente e fonte com capacidade compatível; não é permitido reduzir a geração.
- Cada troca desconta o **custo integral**, sem venda/reembolso da placa usada.
- O cálculo da fonte considera os watts do CPU, RAM, armazenamento, placa-mãe e GPU, mais **25% de margem**, arredondado para o próximo múltiplo de 50 W.
- As GPUs mais recentes continuam compatíveis com jogos que exigem gerações anteriores, respeitando os requisitos independentes de Windows e licença de jogo.
- A tela de GPUs usa a mesma porta de aplicação e seus botões delegados; cada modelo tem um SVG original carregado dos assets locais.
- IDs GPU falsos ou desconhecidos são rejeitados pela validação de save. Os saves anteriores sem lista de GPU continuam válidos.

O novo módulo `src/sim/gpuCatalog.ts` é a fonte única dos dados técnicos de GPU, evitando divergência entre a loja, a simulação e a avaliação da fonte.

## Validação

Executar `npm run typecheck`, `npm run build`, `node --test tests/gpu.test.mjs tests/gpu-modern-generations.test.mjs tests/gpu-catalog-boundary.test.mjs tests/hardware-components.test.mjs` e a auditoria Chromium dos controles de hardware. Build sozinho não garante comportamento correto. Não alterar receitas dos jogos, licenças ou economia geral sem uma auditoria de ROI separada.
