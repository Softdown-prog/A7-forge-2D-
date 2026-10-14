# Lan House Simulator — Game Design Document V1

**Fonte canônica da ideia compartilhada em 12/10/2026.** Não descartar funcionalidades por ainda não estarem implementadas. Este documento diferencia a visão completa do recorte jogável inicial.

## 1. Premissa e tom

Um pequeno empreendedor realiza o sonho de abrir uma lan house. O desafio é administrar a operação, manter dinheiro em caixa e expandir sem quebrar. O tom é tycoon/sandbox acolhedor, com humor, situações cotidianas e visitantes excêntricos. O protagonista é um personagem fixo atrás do balcão, selecionável por clique, que abre os painéis administrativos. Não é um avatar de controle livre.

## 2. Plataforma, câmera e arte

- Navegador, HTML5, TypeScript, Canvas 2D, CSS para painéis.
- Renderização totalmente 2D. **Sem Blender ou motor 3D como requisito**, inclusive para personagens.
- Câmera fixa; visual isométrico/dimétrico de grade 2:1; eixo horizontal do mundo girado 45°; tile lógico **128×64**; inspiração no contrato `CH_CAMERA_V1` do City Horizon, sem importar sua engine. OBS: a razão gráfica 2:1 corresponde à projeção dimétrica, não a uma elevação geométrica de câmera de 45°. O pitch nominal do contrato artístico é 30°.
- O jogador não rotaciona o cenário; objetos e personagens são desenhados para a vista única. Animações de movimento usam direções sobre a grade.
- UI adaptável em desktop e celular, botões/painéis gerados com técnica **nine-slice (9 fatias)**.
- Arte final por A7 Forge 2D: receitas JSON, camadas, materiais, máscaras e alpha, paleta do estabelecimento; PNGs autorais com âncora, sombra, revisão 1x e teste sobre mapa.

## 3. Sala inicial

Salão pequeno com entrada, paredes, chão, balcão de atendimento, empreendedor atrás do balcão, três mesas com computadores, cadeiras, telas animadas, máquina de refrigerante, máquina de doces e prateleira de balas/paçocas/biscoitos/salgadinhos. Iluminação e cômodos podem evoluir depois. Um caixa/terminal administrativo fica no balcão. A simulação desenha placeholders primeiro e os troca por sprites aprovados progressivamente.

## 4. Jornada do cliente (máquina de estados)

`chegando -> fila_balcao -> pagamento -> andando_ate_pc -> usando_pc -> levantando -> compra_opcional -> saindo`

- A demanda aparece conforme preço, reputação, lotação, clima/incidentes e qualidade do serviço.
- O cliente entra pela porta, caminha até o balcão e paga antes de utilizar uma estação. Se não houver vaga, pode desistir após esperar.
- Cobrança por sessão proporcional ao tempo de uso e preço/hora; caixa e evento de moeda.
- Na mesa: sobreposição da pose sentada sobre a cadeira, cabeça/mãos discretamente animadas, LED/tela piscando; ao terminar, animação de levantar e caminhada de saída.
- Compra opcional de bebida/doce/lanche, com baixa de estoque e lucro contabilizado.
- Variantes de visitantes comuns e fantasias absurdas: palhaço, monstro costurado, vampiro, coelho cartunesco, rato cartunesco genérico, mascotes originais etc. Não usar a identidade visual de Mickey, Pernalonga ou outras propriedades protegidas.
- Identidade do personagem e posição de pés consistentes entre animações; evitar gerar outro rosto a cada frame.

## 5. Administração / economia

Moeda de jogo em reais (R$). Receita por computador, venda de refrigerantes, doces, balas, paçocas, biscoitos e salgadinhos. Custos de estoque, internet mensal, aluguel do salão, energia, manutenção e futuras taxas/empregados. Ajuste de preços afeta demanda e satisfação: cobrar mais rende por cliente, mas reduz chegadas; cobrar menos aumenta procura e também custos operacionais/consumo. Estoque é finito: comprar barato ou premium muda margem, satisfação e perfil dos visitantes.

Recursos planejados: `cash`, `pricePerHour`, `reputation`, `computers`, `occupiedComputers`, `inventory` por categoria, `supplierTier`, `internetTier`, `internetOnline`, `gameLicensesOwned`, `rent`, `monthlyBills`, `day`, `clock`, `events`, `expansionLevel`. Saldos nunca são aumentados artificialmente no rollover.

## 6. Acontecimentos e desafios

- Clima de fora é um **evento de lógica**, não chuva animada na tela. Dias chuvosos podem reduzir demanda e aumentar a chance de instabilidade de rede.
- Queda de internet: pausa/reduz serviço, aumenta reclamação e pressiona reputação. Upgrade reduz frequência ou duração; permitir reparo emergencial futuramente.
- Custos cobrados a cada mês de jogo: aluguel, link de internet, energia e manutenção.
- Inspeção de software: jogos comerciais sem licenças podem gerar multa e perda de reputação; comprar licenças regulariza a oferta. Não ensinar distribuição ilegal de jogos.
- Pequenos acontecimentos: cliente impaciente, máquina sem produto, troco, fila grande, fantasia inusitada, cliente VIP e descontos de fornecedor.
- O negócio pode operar com prejuízo: caixa negativo é permitido e vira risco de falência/dívida; não esconder custos.

## 7. Progressão e expansão

**Começo:** balcão + dono + 3 PCs + prateleira + 2 vending machines, poucos produtos, internet básica, uma sala.

**Médio prazo:** colocar computadores adicionais, mesas/cadeiras e itens de conforto; internet rápida; fornecedores; estoque diferenciado; catálogo licenciado; painéis financeiros; expansão da área interna para nova sala.

**Avançado:** sala anexa, novos setores, mais clientes e clientes especiais, eventos de bairro, despesas crescentes, funcionários opcionais e reforma visual do salão. Expansões precisam validar espaço e fluxo de caminhada.

## 8. Som e apresentação

Os efeitos de moeda, refrigerante/líquido, máquinas e compras serão **arquivos originais gravados pelo criador**. O jogo prepara ganchos e não distribui arquivos inexistentes. Sem áudio autoplay antes de gesto do jogador. Arquivos futuros vão em `assets/audio/`. Música é opcional.

## 9. Recorte inicial e critérios de aceitação

O primeiro vertical slice deve executar no navegador, desenhar o salão 2:1 com balcão e protagonista clicável, três computadores, visitantes que entram/pagam/usam/saem, telas piscando, saldo e vendas, estoque básico, ajuste de preço, despesas mensais, queda de internet e expansão simples. Arte de forma geométrica é explicitamente temporária. A7 worker renderiza pelo menos um objeto de demonstração para avaliação, sem autoprover assets ao jogo. Testes automatizados verificam preços, demanda, despesas e contratos.

Funcionalidades além do vertical slice permanecem neste documento e no backlog, sem declaração de prontidão antes do teste em runtime.

## 10. Contrato visual atualizado — sala cutaway flutuante (12/10/2026)

- A visão é **de cima em isometria 2:1**, como se o jogador tivesse removido o telhado para enxergar o interior inteiro. O jogo nunca desenha o telhado.
- A lan house é **uma sala flutuante recortada (dollhouse cutaway)**, com piso de espessura visível nas bordas e parede somente no fundo/laterais. A frente fica aberta para a câmera. Sem mundo exterior, calçada, vizinhança, céu de gameplay nem garagem.
- Entrada/saída acontece somente pela borda do salão: uma soleira e um ponto de spawn/despawn lógico. Nada é simulado do lado de fora da porta.
- Câmera fixa por todo o jogo; manter tile 128x64 e dimensões/âncoras proporcionais. Nomes técnicos: projeção dimétrica 2:1, eixos do mundo a 45°; não confundir com pitch de 45°.
- Um cartão discreto de **previsão do tempo**, com identidade visual própria, sinaliza "sol" ou "chuva" e muda as probabilidades de instabilidade. A chuva não precisa ser desenhada sobre a sala.

## 11. Progressão tecnológica (roadmap, sem implementação prematura)

**Conexão de internet**: discada (início, lenta e propensa a falhas) -> via rádio (melhor e menos instável) -> fibra óptica (rápida e mais confiável). O protótipo já tinha 3 níveis abstratos de conexão; nesta etapa só damos nomes a eles e documentamos a progressão. Custos recorrentes e eventos de chuva devem permanecer coerentes com o nível. Futuramente velocidade pode determinar número de computadores simultâneos e satisfação, mas sem expandir a simulação agora.

**Computadores**: ponto de partida com máquinas da era **Windows 98**; evolução por compras/atualizações para **Windows 2000, XP, Vista, Windows 7, 8/8.1, 10 e 11**. São referências de época e progresso da loja, não softwares reais instalados no navegador. A arte deve usar computadores originais (CRT antigos até desktops modernos), sem reproduzir ícones/logos/temas gráficos protegidos. Os upgrades deverão alterar custo, demanda, manutenção e eventualmente catálogo de jogos compatíveis; por enquanto registramos a sequência, sem comprar uma quantidade enorme de equipamentos de uma vez.

**Ordem de implementação**: primeiro validar sala/câmera/fluxo. Depois internet de 3 níveis; só mais tarde modelos de computador e UI de upgrades. Não inserir todos os objetos e desafios simultaneamente.
\n## 12. Modelo de negócio aprovado — gratuito + Cookies (14/10/2026)\n\n- O nome oficial é **LHS — Lan House Simulator** e os créditos premium chamam-se **Cookies (biscoitos, 🍪)**. Não confundir a moeda com cookies HTTP. A moeda em R$ da administração é separada.\n- Jogo integralmente gratuito, sem assinatura nem venda obrigatória; login opcional para jogar. A loja oferece itens opcionais como decoração, pôsteres, temas, skins e aparências de computadores, sem bloquear progressão.\n- O progresso continua local durante a partida. O jogador decide quando **salvar manualmente** seu JSON no GCS privado; ao autenticar, pode recuperar o snapshot. Não salvar automaticamente na nuvem sem outra decisão.\n- Cloudflare = frontend; Cloud Run Node.js = autorização/pagamento; Firestore = conta, carteira de Cookies, pedidos e direitos premium; GCS = save JSON. A simulação continua no navegador.\n- Regras completas e critérios de aceite em [ONLINE_COOKIES_CLOUD_CONTRACT.md](ONLINE_COOKIES_CLOUD_CONTRACT.md). **Ainda não implementado.**\n