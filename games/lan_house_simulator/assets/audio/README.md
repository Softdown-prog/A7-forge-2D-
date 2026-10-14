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

## Revisão de áudio — 13/10/2026
- Som procedural de lata REPROVADO pelo criador na escuta; reprodução de `playVendingCan` desativada no runtime.
- Não promover automaticamente outro som de refrigerante sem prévia audição e aprovação.
- Efeito aprovado `money_income_01.ogg` de pagamento permanece ativo.

## Clique de mouse da interface
- `mouse_click_002.ogg`: som original CH Audio Lab aprovado pelo criador e copiado do City Horizon (`assets/audio/ui/mouse_click_002.ogg`).
- Reproduz uma vez por ativação dos botões da administração, inclusive teclado/tecnologia assistiva, e ao clicar no dono para abrir o painel.
- Botões desativados não produzem o clique; pagamento mantém seu som distinto.
- Original Git blob `66cedc5c95c375d880a9d55390a1e95459c36919`.

## Teclado autoral aprovado — V3 (14/10/2026)

- As gravações autorais `te1.m4a`, `t2.m4a`, `t3.m4a` continuam preservadas em `assets/Convert/`.
- Trechos de 3,3 segundos aprovados pelo criador estão agora em `assets/audio/keyboard_te1.ogg`, `keyboard_t2.ogg`, `keyboard_t3.ogg` (OGG Vorbis mono, 48 kHz); promoção reproduzível pelo workflow `lan-house-promote-keyboard.yml` a partir das gravações originais e do A7 Audio Lab.
- `src/audio/soundscape.ts` alterna deterministicamente te1 → t2 → t3 entre inícios de sessão, sem loop nem superposição do mesmo efeito.
- Ganhos em um único mixer Web Audio: teclado `0.040`, mouse `0.105`, venda `0.15`, pagamento `0.24`. Durante cliques e pagamentos, o teclado é temporariamente atenuado para preservar a hierarquia da mistura sonora de Tycoon.
- Se algum arquivo falhar, usa os restantes; sem nenhum OGG disponível, retorna à síntese procedural anterior.
- Desligar sons, sair para o menu e entrar em modo de construção interrompem a digitação. Mouse e dinheiro permanecem inalterados.

## Mixagem de interface, caixa e teclado — V2

- `src/audio/soundscape.ts` centraliza o `AudioContext`, pré-decodifica os dois arquivos OGG originais e usa um único listener para botões (inclusive controles gerados dinamicamente). Não recria `HTMLAudioElement` a cada clique; teclado e caixa usam o mesmo relógio de áudio.
- Prioridade de volume: teclado baixo, clique discreto, dinheiro de venda moderado e pagamento um pouco mais audível. Não amplificar junto múltiplas entradas no mesmo instante.
- `s.keyboardEffects` é um evento transitório emitido **uma vez** na transição `sitting → using`, e drenado pelo runtime. Teclas procedurais de ruído suavizado por aproximadamente 3,5 segundos, sem loop ou acesso ao ponteiro/mouse.
- Modo de compra/organização e menu interrompem o teclado; o alternador de efeitos sonoros também o silencia. Respeita autoplay: somente habilita saída por gesto do usuário.
- As gravações aprovadas `mouse_click_002.ogg` e `money_income_01.ogg` continuam intactas. O som de lata reprovado continua desligado. As gravações autorais tratadas substituem o efeito padrão; a receita procedural continua como fallback offline.

## Refrigerante aprovado — correção de audibilidade (14/10/2026)

- Os takes tratados `vending_soda_01.ogg` e `vending_soda_02.ogg` são os originais aprovados, preservados **sem alteração dos bytes**. A síntese de lata rejeitada segue desligada.
- Continua **28% de chance por venda real de refrigerante** e **12 s** mínimos entre reproduções. O som pode não tocar em uma compra específica; respeita a opção Efeitos sonoros.
- O ganho passou de `0.032` para `0.085` e o líquido agora começa `0.90 s` após o caixa: menos mascaramento; ainda abaixo de mouse e pagamento.
- Não há botão de prévia ou outras opções técnicas no site em produção: o efeito é reproduzido somente no fluxo normal das vendas reais.
- Validação: `tests/soda-audio.test.mjs` verifica alternância, temporização, níveis, arquivos OGG originais e cópias do build, silenciamento e ausência de controles de teste na UI.
