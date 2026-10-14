# Artes dos pôsteres — 14/10/2026

`src/render/posterArt.ts` reúne sete ilustrações vetoriais originais, desenhadas pelo Canvas de produção: parque com montanha-russa, cenário tático, campo de golfe, veículo espacial, cidade isométrica e duas composições de monitor CRT para a identidade da lan house. Os cinco temas de jogos mantêm os nomes anteriores; os quadros LAN/JOGOS também passam pelo mesmo acabamento.

Cada peça tem uma composição própria, título, paleta, moldura com bordas iluminadas, rodapé e sombra de contato. Imagem e lettering são projetados juntos no plano da parede por uma transformação afim. Isso evita símbolos e títulos planos flutuando sobre uma moldura inclinada. Altura, espaçamento e locais anteriores continuam sendo as referências do salão.

## Pôsteres comprados

Os antigos painéis de cor sólida ganham artes da coleção. A seleção visual segue a ordem dos pôsteres instalados, sem usar RNG ou adicionar campos ao save. Mover um pôster explícito mantém sua composição; a expansão resolve as novas posições pelas APIs/slots existentes. Saves legados sem `furniturePlacements` também recebem as artes. Preços, limites, receita e regras de colocação são preservados.

Os pôsteres continuam dentro do cache de fundo estático, atualizado quando a sala ou os móveis de parede mudam. As ilustrações usam operações locais de Canvas e fontes de sistema; não há carregamento de imagens remotas nem novos arquivos pesados na partida.

## Verificação e reprodução

```sh
npm test
npm run audit
node scripts/capture_poster_art.mjs out/posters
node scripts/verify_rendering.mjs out/posters
node scripts/capture_scene.mjs out/posters/scene
```

Os 173 testes e a auditoria passaram. A inspeção Chromium gerou a coleção plana, cena real e sala ampliada, verificando duas compras pagas e realocação de `wall-1` para `wall-north-1`. O desenho não alterou o estado do jogo. O script aceita opcionalmente um `scene.js` compilado anterior como terceiro argumento para produzir uma comparação na mesma câmera.

Os seis casos de cache (inicial, repetição, expansão, compra/realocação de pôster e compra de planta) mantiveram delta de pixel zero entre o desenho direto e o cache. O worker de cena gera as pranchas e confere as posições pagas. Capturas desktop/mobile emulado passaram sem erros de navegador; aprovação artística e leitura em telefone físico continuam a cargo da revisão humana.

As alterações simultâneas do painel de preços foram preservadas e seus nove testes passaram. A verificação de interface resolve e dispara cliques nos filhos SVG numa única tarefa do navegador: uma atualização ao vivo não pode trocar o nó entre a busca e o clique sintético. As verificações de diário, gasto, compra e foco continuam ativas.
