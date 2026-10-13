# Efeitos sonoros autorais

O autor possui gravações originais próprias. Aguardar envio dos arquivos; não inventar nem baixar sons de terceiros.

Nomes sugeridos:
- `coin.wav`: cliente paga no balcão.
- `liquid.wav`: máquina serve refrigerante / líquido.
- `vending.wav`: compra de doce ou salgadinho.
- `network_down.wav`: opcional, falha de internet.

Os arquivos serão opcionais. Reprodução apenas após interação (política dos navegadores). Manter originais em `assets/audio/` e registrar licença/autoria no manifesto antes de distribuir.

## Efeito aprovado de caixa
- `money_income_01.ogg`: artefato autoral CH Audio Lab, selecionado anteriormente (versão simples de caixa registradora, run 9).
- Fonte: `City-horizon-/assets/audio/economy/money_income_01.ogg`, blob de origem `f29a151a391c3f45468bfccd5032dd3a11367ed5`.
- Usado apenas após pagamento confirmado no balcão; reprodução sujeita a desbloqueio de áudio do navegador.

## Refrigerante e doces — receita procedural original
- `src/audio/vendingSfx.ts`: síntese com AudioContext (sem dependências externas).
- Refrigerante: liberação do mecanismo → queda de lata → quique na bandeja → arrasto/rolamento com impactos amortecidos.
- Doce/salgadinho: liberação curta + pequena queda, sem som de lata.
- Emissão somente após `sellItem` retornar sucesso; não emitir com produto esgotado.
- Não substitui o arquivo de caixa aprovado `money_income_01.ogg`.
