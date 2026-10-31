# Fórum Linux — março a agosto de 1999

Esta é **uma missão narrativa específica aprovada pelo criador**, não a lista rejeitada de 33 eventos anuais da PR #40.

## História

Em março de 1999, um grupo fictício de estudantes e entusiastas manda uma mensagem ao Tony perguntando se a lan house tem computadores Linux. Tony não sabe bem o que é Linux. Pelo próprio correio, o jogador inicia a pesquisa. O calendário controla os retornos do grupo e o desbloqueio de instalar Linux.

O jogo usa **12 meses de 30 dias**. Dias absolutos do calendário:
- 1999/03/01: dia **421** — primeiro e-mail.
- Depois de 30 dias desde o início da pesquisa: orientação sobre distribuições e software livre.
- Depois de 75 dias: preparação da mídia e teste.
- 1999/08/01: dia **571** — desbloqueio se pelo menos 110 dias de pesquisa tiverem transcorrido.

Se o jogador começar a pesquisa depois, os 110 dias ainda são exigidos; o desbloqueio não é instantâneo. A oportunidade não desaparece em saves antigos. Os quatro e-mails são únicos e persistentes mesmo após compactação da caixa postal. Apenas um e-mail chega a cada revisão.

## Jogabilidade

- A pesquisa é iniciada em **Correspondência** usando “Tony vai pesquisar Linux”, sem escolhas arbitrárias e sem custo fictício.
- A partir da conclusão, cada PC *desligado e livre* pode receber Linux em **Administração → Licenças → Windows**. Instalação sem custo de licença; os PCs usam o hardware e a localização reais.
- O Linux instalado é mantido ao alternar para Windows. As licenças Windows permanecem intactas.
- Clientes reais podem contratar sessões nas máquinas Linux; um subconjunto determinístico de estudantes procura *somente Linux*, se houver equipamento operacional. Não são NPCs inventados nem há receita sem pagamento.
- Uma tela de terminal original é desenhada em Canvas 2D procedural tanto no CRT quanto no LCD e continua operável offline para programação.
- Jogos comerciais que exigem Windows licenciado/GPU não passam a rodar artificialmente em Linux. O sistema Windows continua presente e intacto.

## Validação necessária

\`npm run typecheck\`, \`npm run build\`, \`node --test tests/linux-forum-1999.test.mjs\`, \`npm test\`. Antes de mesclar, usar o navegador real para verificar o correio e os botões mobile, Linux ligado e Windows restaurado, tela CRT no zoom padrão, e ausência de regressão do PS1/PS2.

**Esta entrega exige revisão de gameplay no navegador.** Os testes unitários não provam que a interface está bem apresentada ao usuário. O PR não é mesclado automaticamente.

## Próximos aprimoramentos possíveis

- Pedido de reserva do grupo do fórum, no balcão, com vários estudantes usando Linux, condicionado a lugares e pagamento reais.
- Ferramentas fictícias de programação visíveis no CRT, com diferentes cenas de terminal/editor.
- Diferença entre distribuições disponíveis por época, com compatibilidade de hardware; não inventar nomes ou datas sem checagem histórica.
