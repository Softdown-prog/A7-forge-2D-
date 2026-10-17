# Auditoria de licenças GPU — 90 dias

Lan House Simulator · cenário de laboratório reproduzível · dados extraídos da
execução GitHub Actions [39003581677](https://github.com/Softdown-prog/A7-forge-2D-/actions/runs/39003581677).

## Desenho

- Período: 90 dias de jogo por partida, iniciados em 2005, 2009 ou 2013.
- Sementes: **23 e 137**; resultados da tabela são médias das duas.
- Mesmo hardware nos braços com e sem licença; 1 ou 2 PCs equipados
  entre os 3 computadores originais.
- O único investimento inicialmente diferente dentro de cada par é
  a licença avançada específica do ano; plataforma, GPU e Windows são
  mantidos iguais nos dois braços.
- Caixa de laboratório inicial **R$ 100.000**, não o orçamento inicial
  de jogo real; tarifa inicial do cenário **R$ 2,50/h**, sem busca de preço
  ótimo para cada ano. O motor executa vendas, sessões, contas, reparos,
  reposição e limpeza reais.
- Em todos os 24 braços houve contabilidade conservada e importação
  de save válida; nenhum dinheiro, cliente ou venda foi criado depois
  do financiamento inicial de laboratório.

## Resultados

| Ano | Jogo | PCs aptos | Adicional médio recebido | Custo licença | Cobertura nominal |
| --- | --- | ---: | ---: | ---: | ---: |
| 2005 | Neon Rush Online | 1 | R$ 112,40 | R$ 580 | 19,35% |
| 2005 | Neon Rush Online | 2 | R$ 211,06 | R$ 580 | 36,40% |
| 2009 | Circuito Competitivo | 1 | R$ 101,35 | R$ 950 | 10,70% |
| 2009 | Circuito Competitivo | 2 | R$ 180,22 | R$ 950 | 18,95% |
| 2013 | Arena do Futuro | 1 | R$ 82,88 | R$ 1.550 | 5,35% |
| 2013 | Arena do Futuro | 2 | R$ 178,89 | R$ 1.550 | 11,55% |

**Leitura correta:** a cobertura compara o adicional cobrado dos clientes
que jogaram o título solicitado com o preço da licença. Não inclui a
tarifa básica da sessão e não representa lucro líquido. Os custos de
GPU, Windows, reparos, energia e instalações já afetam o resultado
financeiro completo de cada cenário, mas não a porcentagem de cobertura
da licença na tabela.

A quantidade total de sessões servidas foi igual entre braços pareados
nesta amostra; as diferenças de receita estão concentradas nos adicionais
do título. Em 90 dias nenhum cenário recuperou o valor nominal da
licença. Mais computadores compatíveis aumentaram o adicional, mas também
exigiram investimentos próprios e **não provaram lucro**.

## Próxima decisão de balanceamento

1. Repetir os mesmos cenários com tarifa anual ajustada à qualidade do
   parque de máquinas, em vez de concluir que a licença custa demais.
2. Comparar os resultados com partidas iniciadas com R$ 850, para medir
   a dificuldade real de chegar às GPUs e aos títulos de cada ano.
3. Avaliar campanhas mais longas, custo incremental de computadores,
   fila/ocupação e receita total antes de ajustar catálogo e bônus.

Reproduzir: `cd games/lan_house_simulator && npm run audit:gpu-licenses`.
A execução gera um JSON com os **24 resultados individuais e as seis
médias**, enviado como artefato `lhs-gpu-license-90day-audit` do
workflow. Nenhuma tarifa é alterada por esta auditoria.
