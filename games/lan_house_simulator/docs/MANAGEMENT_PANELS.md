# Administração por tarefa — 18/10/2026

A administração mantém as oito áreas existentes, com tarefas menores dentro das áreas extensas:

- Preços: hora/pacotes, análise, produtos, impressões e cópias.
- Computadores: operação/reparos, peças/configuração, Windows, monitores e receita por PC.
- Licenças: Windows por computador, jogos clássicos e jogos com GPU.
- Serviços: equipe/limpeza, internet/contrato e passagens.
- Videogames: bancadas, preço e acervo de CDs.
- Finanças: caixa/contas, ocupação/resultado, divulgação e reinício.

No celular, um seletor nativo escolhe a área. A visão geral fica recolhida inicialmente, com caixa e previsão mensal no resumo; seus quatro indicadores continuam acessíveis ao expandir. A explicação financeira e o aviso de fechamento ficam em Finanças. A configuração instalada de cada PC tem um resumo expansível, independente do catálogo de peças.

A loja monta uma categoria por vez: computadores/serviços, videogames/CDs, construção ou decoração. As instruções longas ficam em uma seção expansível. As prévias de impressora, copiadora e console são desenhadas uma vez e reutilizadas como imagens.

`src/ui/managementPanels.ts` organiza os elementos existentes sem duplicar IDs/listeners. `shopPanels.ts` cuida das categorias. O host delegado dos computadores permanece o mesmo; somente a tarefa selecionada monta controles. As revisões dos catálogos de hardware/licenças consideram suas próprias dependências. Desgaste não obriga reconstruir o catálogo de peças. Os controles de preço e a tabela de receita são reconciliados sem remover o botão em foco.

O desenho da cena não depende mais de uma janela sem eventos de rolagem. Em dispositivos com apontador de toque, a apresentação usa até 30 desenhos/s; o relógio e a economia da simulação continuam iguais. Painéis abertos, aba oculta e cena fora da tela continuam evitando desenho desnecessário. Isso corrige a interrupção deliberada durante o gesto; não é uma promessa de FPS para todo telefone.

Validação: `npm run build`, regressões de compras/saves existentes e `node scripts/verify_management_panels.mjs`. O último percorre as tarefas em 1280, 414 e 360 px, em 1998 e 2024, com CPU limitada em 4× nos casos móveis, e verifica acesso a todos os 14 itens da loja, rolagem nativa, controles estáveis, catálogos ocultos e desenho durante eventos contínuos de scroll. As capturas e os relatórios ficam em `out/management` ou no diretório indicado. São testes no Chromium, não medições de um aparelho físico.
