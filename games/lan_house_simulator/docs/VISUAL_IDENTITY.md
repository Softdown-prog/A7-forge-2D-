# Terminal de bairro — identidade visual do Lan House Simulator

A interface parte da ideia de abrir uma pequena lan house em 1998. A linguagem combina um terminal verde, gabinetes CRT claros e pequenos detalhes de papelaria do comércio de bairro. A mesma identidade aparece no menu, no salão e nos espaços de administração.

## Fundamentos

| Elemento | Uso |
| --- | --- |
| Grafite verde `#192e2a` | Fundo, cabeçalhos e textos sobre superfícies claras |
| Creme `#f0eadc` | Janelas, gabinete CRT e leitura de informações |
| Verde de terminal `#b9d7a3` | Ação principal, conexão, navegação ativa e marca |
| Âmbar `#e2a664` | Destaques, pequenos carimbos, divulgação e sinais de atenção |
| `Trebuchet MS` / fontes de sistema | Texto funcional, títulos e números de gestão |
| `Courier New` / monospace | Etiquetas de terminal e pequenos códigos visuais |

Fontes de sistema evitam downloads externos. Botões usam formas, cores, estados desabilitados e foco visível, além de ícones; a cor não é o único modo de identificar uma ação.

## Arte e componentes

- `assets/ui/brand.svg`: marca original de monitor com cursor de terminal; também usada como favicon.
- `assets/ui/icons.svg`: 41 símbolos SVG com traço consistente, sem bibliotecas de ícones, emojis variáveis por sistema ou imagens remotas.
- `src/ui/presentation.ts`: aplicação de ícones, HUD, manutenção, estoque, indicador real de ocupação e navegação das janelas.
- `src/render/theme.ts`: cores do salão. Câmera, footprint, posições, âncoras, mobília e identidade dos atores são preservados.
- `style.css`: superfícies, grade responsiva, monitor CRT, botões, cartas, estados ativos, ferramentas e comportamento com movimento reduzido.

O monitor da tela inicial é construído em CSS. Sua tela usa o `SceneRenderer` do jogo com um estado de apresentação independente. Animar essa prévia nunca chama `stepGame` para a partida do jogador.

## Espaços integrados

O HUD apresenta caixa, reputação, conexão, PCs em uso e quantidade de clientes. Calendário, clima e campanha de divulgação continuam derivados do estado real. O diário usa os eventos existentes da simulação.

As sete abas administrativas compartilham cabeçalho, quatro indicadores, navegação por ícones e superfícies claras. Cada computador possui cartão com desgaste verdadeiro; estoque mostra quantidades reais; ocupação usa os minutos-PC medidos pelo motor.

Compras usa cartões com ilustrações da própria família de ícones. Correspondência usa papel, faixa de envelope e ações com ícones. Catálogo de GPUs e licenças preservam recursos e restrições da progressão existente.

As janelas possuem fundo separado do salão, foco ao abrir, retorno de foco ao fechar, contenção de Tab, Escape e navegação por setas/Home/End nas abas. Fechar uma janela mantém a partida aberta. Menu/Pausar volta à tela inicial.

## Validação

```bash
npm test
npm run audit
node scripts/capture_identity.mjs out/identity --video
```

O script requer Playwright/Chromium, FFmpeg e a porta local 4173 livre. Deve rodar depois do build, sem reconstruir `dist` enquanto o navegador o utiliza.

Ele examina 11 telas em três tamanhos: menu, salão, sete abas, loja e correio. Verifica limites contra a largura configurada do aparelho emulado, erros HTTP/de página, foco, Escape, abas por teclado, som, ações disparadas nos próprios filhos SVG e exportação/importação de uma partida de teste. Cliques de estoque e reparo devem alterar o estado real, com conservação do caixa. A prévia respeita movimento reduzido.

O worker de cena executa a revisão e publica capturas, resultado JSON e um MP4 silencioso no artifact `lhs-visual-identity`. Os 146 testes da simulação passaram na versão integrada com os refinamentos recentes de atores e a preferência VIP por hardware.

Emulação móvel não substitui a revisão em aparelho físico. A interface já está integrada ao jogo; aprovação artística de sprites finais permanece separada.
