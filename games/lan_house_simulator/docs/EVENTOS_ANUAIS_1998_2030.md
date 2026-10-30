# Lan House Simulator — 33 acontecimentos anuais (1998–2030)

**Status:** proposta narrativa para discussão e implementação gradual. **Nenhum evento deste catálogo está implementado ou aprovado automaticamente.**  
**Criado:** 29/10/2026 · **Período jogável:** 1998 a 2030, inclusivos · **Total:** 33 propostas, uma para cada ano.  
**Escopo:** somente `games/lan_house_simulator/`; não altera o calendário existente, backend, economia, saves ou código neste documento.

## Propósito

Criar um pequeno acontecimento surpreendente por ano, além dos eventos já existentes. Não são festas, missões obrigatórias nem 33 cartas de cobrança: são cenas do cotidiano do balcão e do salão, perguntas inusitadas, encontros e mudanças no jeito de usar computadores, com humor, contexto de época e escolhas leves. O jogador deve **sentir a passagem dos anos** sem precisar estudar uma lista de tarefas.

A lista abaixo é um **cardápio de design**, não uma obrigação de adicionar 33 sistemas. Em cada implementação, preferir usar clientes, filas, PCs, reputação, estoque, manutenção, renderização e serviços já existentes.

## Limites: não repetir o jogo que já temos

Este catálogo é **adicional** aos oito avisos esporádicos e às 12 histórias com desdobramentos (como goteira, vizinhos, teclado, malware, fornecedor, energia, rede, estoque, privacidade, jornal e ação comunitária). Também não substitui as quatro cadeias legadas.

Já existem momentos próprios para **1999 (Bug do Milênio), 2000 (primeiros contatos de Eric sobre multiplayer), 2001 (contexto da crise de energia), 2002 (chegada do PS1), 2004 (estudantes de uniforme) e 2005 (jogos que exigem GPU)**. As 33 ideias abaixo convivem com eles e não devem reproduzir seus gatilhos nem conceder automaticamente suas funcionalidades. Consulte `MAIL_CALENDAR_1998_2030.md`, `STORY_CONSEQUENCE_PIPELINE.md`, `src/sim/ericStory.ts` e `src/sim/storyEvents.ts`.

## Índice por ano

| Ano | ID persistente proposto | Acontecimento | Tipo | Complexidade |
| --- | --- | --- | --- | --- |
| 1998 | `anual-1998-cliente-ensina-tony` | O cliente que ensinou o dono | cotidiano | baixa |
| 1999 | `anual-1999-pagamento-em-moedas` | O saco de moedas | humor | media |
| 2000 | `anual-2000-disputa-pc-janela` | O computador da janela | cotidiano | media |
| 2001 | `anual-2001-ventilador-calor` | A tarde abafada | imprevisto | baixa |
| 2002 | `anual-2002-espectador-entusiasmado` | O torcedor de cadeira | humor | media |
| 2003 | `anual-2003-curriculo-ultima-hora` | Currículo faltando cinco minutos | servico | media |
| 2004 | `anual-2004-chave-esquecida` | A chave perdida | cotidiano | baixa |
| 2005 | `anual-2005-reflexo-na-tela` | O reflexo no monitor | imprevisto | media |
| 2006 | `anual-2006-adesivos-gabinete` | O gabinete ganhou um adesivo | humor | baixa |
| 2007 | `anual-2007-quadro-de-recados` | O mural improvisado | cotidiano | baixa |
| 2008 | `anual-2008-notebook-na-tomada` | Posso ligar meu notebook aqui? | tecnologia | baixa |
| 2009 | `anual-2009-atalhos-do-teclado` | O rei dos atalhos | humor | baixa |
| 2010 | `anual-2010-pedido-de-wifi` | Wi-Fi sem alugar computador? | tecnologia | baixa |
| 2011 | `anual-2011-duvida-impressao` | Dá para imprimir dos dois lados? | servico | baixa |
| 2012 | `anual-2012-fone-compartilhado` | O fone que vive passando de mão | cotidiano | baixa |
| 2013 | `anual-2013-foto-do-salao` | Uma foto para postar | tecnologia | baixa |
| 2014 | `anual-2014-video-carregando` | O vídeo que não termina de carregar | imprevisto | baixa |
| 2015 | `anual-2015-tomadas-disputadas` | Todo mundo quer carregar o celular | cotidiano | baixa |
| 2016 | `anual-2016-nomes-parecidos` | Quem reservou o PC? | humor | media |
| 2017 | `anual-2017-gravacao-do-salao` | O vídeo no meio do corredor | cotidiano | baixa |
| 2018 | `anual-2018-sessao-esquecida` | O cliente esqueceu de sair do computador | servico | media |
| 2019 | `anual-2019-avaliacao-sem-contexto` | Uma avaliação injusta | cotidiano | baixa |
| 2020 | `anual-2020-atendimento-com-hora` | Atendimento com hora combinada | cotidiano | media |
| 2021 | `anual-2021-microfone-aberto` | O microfone estava aberto! | humor | baixa |
| 2022 | `anual-2022-adesivo-qr` | Um QR code apareceu no vidro | imprevisto | baixa |
| 2023 | `anual-2023-meme-do-tony` | O meme do Tony | humor | baixa |
| 2024 | `anual-2024-jogo-na-nuvem` | Preciso de um PC potente para jogar na nuvem? | tecnologia | baixa |
| 2025 | `anual-2025-nostalgia-crt` | Saudade do monitor de tubo | humor | baixa |
| 2026 | `anual-2026-resposta-automatica-errada` | O conselho da máquina estava errado | tecnologia | baixa |
| 2027 | `anual-2027-assistente-que-confunde` | O assistente confundiu a lan house | humor | baixa |
| 2028 | `anual-2028-cd-e-misterio` | Isso é um CD ou um espelho? | humor | baixa |
| 2029 | `anual-2029-recado-antigo` | O bilhete guardado por anos | cotidiano | baixa |
| 2030 | `anual-2030-album-do-balcao` | O álbum da lan house | legado | media |

*Complexidade baixa* = aproveita mensagens, falas, escolhas e efeitos já existentes; *média* = pode exigir cena contextual, validação de estação/rota ou ações temporárias. Não são estimativas de prazo.

## As 33 fichas para implementação individual

### 1998 — O cliente que ensinou o dono

**ID reservado:** `anual-1998-cliente-ensina-tony` · **Tipo:** cotidiano · **Complexidade preliminar:** baixa.

**O que acontece:** Um frequentador percebe Tony tentando resolver uma tarefa simples no computador e oferece uma dica, diante da fila.

**Três respostas candidatas:** A) Agradecer e testar a dica; B) Pedir para explicar depois; C) Agradecer e continuar atendendo.

**Desdobramento a projetar:** Pequena reação de confiança e diálogo no balcão; nenhuma habilidade mágica nem receita criada.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 1999 — O saco de moedas

**ID reservado:** `anual-1999-pagamento-em-moedas` · **Tipo:** humor · **Complexidade preliminar:** media.

**O que acontece:** Um cliente chega com o pagamento contado em moedas e a fila começa a comentar; não é o Bug do Milênio.

**Três respostas candidatas:** A) Receber e contar com calma; B) Sugerir uma sessão mais curta; C) Pedir para ele voltar com o valor organizado.

**Desdobramento a projetar:** Tempo de atendimento e humor pontuais; só creditar venda se houver sessão real.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2000 — O computador da janela

**ID reservado:** `anual-2000-disputa-pc-janela` · **Tipo:** cotidiano · **Complexidade preliminar:** media.

**O que acontece:** Dois clientes querem a mesma estação porque ela parece mais confortável; a história não envolve Eric nem torneios.

**Três respostas candidatas:** A) Indicar o próximo PC livre; B) Negociar uma alternância; C) Deixar escolherem entre si.

**Desdobramento a projetar:** Paciência e satisfação; sempre respeitar disponibilidade e reservas reais.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2001 — A tarde abafada

**ID reservado:** `anual-2001-ventilador-calor` · **Tipo:** imprevisto · **Complexidade preliminar:** baixa.

**O que acontece:** Num dia quente, o ventilador do balcão faz barulho e chama atenção. É um contratempo local, separado da crise de energia já planejada.

**Três respostas candidatas:** A) Desligar e dar uma pausa; B) Pedir revisão simples; C) Manter ligado e observar.

**Desdobramento a projetar:** Humor dos clientes ou despesa comprovável de manutenção, sem criar sistema obrigatório de climatização.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2002 — O torcedor de cadeira

**ID reservado:** `anual-2002-espectador-entusiasmado` · **Tipo:** humor · **Complexidade preliminar:** media.

**O que acontece:** Um visitante prefere assistir à partida de outra pessoa em vez de alugar computador; pode observar o PS1 se houver bancada, ou um PC.

**Três respostas candidatas:** A) Orientar um lugar seguro para assistir; B) Convidar a aguardar PC livre; C) Pedir que não bloqueie a passagem.

**Desdobramento a projetar:** Animação/comentário transitório; sem cobrar quem não utilizou serviço e sem acrescentar cadeira invisível.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2003 — Currículo faltando cinco minutos

**ID reservado:** `anual-2003-curriculo-ultima-hora` · **Tipo:** servico · **Complexidade preliminar:** media.

**O que acontece:** Uma pessoa aparece aflita para corrigir um currículo antes de sair; a história não é sobre documento perdido.

**Três respostas candidatas:** A) Ajudar se houver estação disponível; B) Indicar impressão se a impressora existir; C) Explicar que o salão está ocupado.

**Desdobramento a projetar:** Uso de PC/impressão apenas por operações reais; resposta humana e satisfação sem pagamento fictício.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2004 — A chave perdida

**ID reservado:** `anual-2004-chave-esquecida` · **Tipo:** cotidiano · **Complexidade preliminar:** baixa.

**O que acontece:** Ao fechar o balcão, Tony encontra um molho de chaves e precisa decidir como ajudar a localizar o dono. Não trata de alunos uniformizados.

**Três respostas candidatas:** A) Guardar identificado; B) Anotar um aviso discreto; C) Entregar somente após confirmar quem é o proprietário.

**Desdobramento a projetar:** Desfecho de confiança alguns dias depois; nunca exibir dados pessoais dos clientes.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2005 — O reflexo no monitor

**ID reservado:** `anual-2005-reflexo-na-tela` · **Tipo:** imprevisto · **Complexidade preliminar:** media.

**O que acontece:** Um cliente reclama que a luz bate no CRT e atrapalha a leitura. É independente da chegada dos jogos com GPU.

**Três respostas candidatas:** A) Ajustar a posição quando livre; B) Usar solução provisória; C) Explicar que precisa esperar a estação desocupar.

**Desdobramento a projetar:** Conforto e possível pedido de mudança; não mover PC ocupado nem modificar geometria sem validação.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2006 — O gabinete ganhou um adesivo

**ID reservado:** `anual-2006-adesivos-gabinete` · **Tipo:** humor · **Complexidade preliminar:** baixa.

**O que acontece:** Um grupo colou um adesivo engraçado no gabinete e outros clientes começam a querer personalizar máquinas.

**Três respostas candidatas:** A) Pedir que retirem; B) Permitir apenas adesivo removível; C) Criar uma regra simples para o salão.

**Desdobramento a projetar:** Reação visual/narrativa opcional; não consumir Cookies premium nem substituir arte aprovada.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2007 — O mural improvisado

**ID reservado:** `anual-2007-quadro-de-recados` · **Tipo:** cotidiano · **Complexidade preliminar:** baixa.

**O que acontece:** Um cliente deixa um bilhete procurando um amigo que costuma jogar ali; a ideia vira um pequeno mural de recados.

**Três respostas candidatas:** A) Deixar um espaço de bilhetes; B) Entregar pessoalmente quando o amigo aparecer; C) Não aceitar recados no balcão.

**Desdobramento a projetar:** Possível encontro posterior, sem revelar informações particulares ou gerar dinheiro automático.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2008 — Posso ligar meu notebook aqui?

**ID reservado:** `anual-2008-notebook-na-tomada` · **Tipo:** tecnologia · **Complexidade preliminar:** baixa.

**O que acontece:** Uma pessoa chega com notebook próprio e quer usar uma tomada, embora não esteja comprando tempo de PC.

**Três respostas candidatas:** A) Oferecer lugar sem atrapalhar a passagem; B) Pedir que aguarde um momento tranquilo; C) Não permitir equipamentos próprios.

**Desdobramento a projetar:** Convivência e espaço físico; não criar cobrança nem serviço de Wi-Fi automaticamente.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2009 — O rei dos atalhos

**ID reservado:** `anual-2009-atalhos-do-teclado` · **Tipo:** humor · **Complexidade preliminar:** baixa.

**O que acontece:** Um cliente faz tudo pelo teclado e impressiona quem está ao lado; outro tenta copiar sem entender.

**Três respostas candidatas:** A) Pedir uma demonstração curta fora de horário ocupado; B) Deixar a conversa acontecer; C) Priorizar silêncio e atendimento.

**Desdobramento a projetar:** Fala e satisfação leves; não é um campeonato formal nem consome sessões extras.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2010 — Wi-Fi sem alugar computador?

**ID reservado:** `anual-2010-pedido-de-wifi` · **Tipo:** tecnologia · **Complexidade preliminar:** baixa.

**O que acontece:** Um visitante pergunta se pode conectar seu aparelho à internet sem usar uma das máquinas.

**Três respostas candidatas:** A) Explicar o serviço atual; B) Registrar o interesse para o futuro; C) Sugerir uso de PC disponível.

**Desdobramento a projetar:** Sinal de mudança de hábitos; não desbloquear roteador, plano ou receitas sem projeto específico.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2011 — Dá para imprimir dos dois lados?

**ID reservado:** `anual-2011-duvida-impressao` · **Tipo:** servico · **Complexidade preliminar:** baixa.

**O que acontece:** No balcão, um cliente pergunta por uma impressão diferente da usual; pode existir ou não impressora instalada.

**Três respostas candidatas:** A) Explicar as opções reais da impressora; B) Ajudar a ajustar o arquivo; C) Encaminhar para outro serviço se indisponível.

**Desdobramento a projetar:** Somente impressão realmente efetuada pode gerar receita e gasto de papel; sem páginas imaginárias.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2012 — O fone que vive passando de mão

**ID reservado:** `anual-2012-fone-compartilhado` · **Tipo:** cotidiano · **Complexidade preliminar:** baixa.

**O que acontece:** Clientes tentam compartilhar o mesmo fone e discutem quem usou primeiro.

**Três respostas candidatas:** A) Orientar o empréstimo; B) Pedir que cada um use o próprio; C) Fazer uma regra simples de uso.

**Desdobramento a projetar:** Reputação/satisfação discretas; não introduzir inventário de fones sem aprovação.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2013 — Uma foto para postar

**ID reservado:** `anual-2013-foto-do-salao` · **Tipo:** tecnologia · **Complexidade preliminar:** baixa.

**O que acontece:** Uma cliente quer fotografar o ambiente para mostrar a amigos, mas algumas pessoas preferem não aparecer.

**Três respostas candidatas:** A) Liberar apenas foto do cenário vazio; B) Pedir consentimento dos presentes; C) Não permitir fotos de clientes.

**Desdobramento a projetar:** Confiança e repercussão opcional; consentimento sempre respeitado, sem propaganda garantida.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2014 — O vídeo que não termina de carregar

**ID reservado:** `anual-2014-video-carregando` · **Tipo:** imprevisto · **Complexidade preliminar:** baixa.

**O que acontece:** Um cliente quer assistir a um vídeo pesado e pergunta por que está demorando, apesar de outros PCs estarem normais.

**Três respostas candidatas:** A) Explicar a condição real da conexão; B) Sugerir aguardar; C) Orientar qualidade mais baixa sem alterar os demais usuários.

**Desdobramento a projetar:** Mensagem baseada no estado real da internet; não fabricar queda de rede nem cobrar por vídeo.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2015 — Todo mundo quer carregar o celular

**ID reservado:** `anual-2015-tomadas-disputadas` · **Tipo:** cotidiano · **Complexidade preliminar:** baixa.

**O que acontece:** Três visitantes começam a disputar a única tomada acessível perto do balcão.

**Três respostas candidatas:** A) Organizar a vez; B) Reservar tomadas aos equipamentos da loja; C) Pedir que liberem a circulação.

**Desdobramento a projetar:** Clima do salão; não criar tomadas, energia ou renda extra sem mecânica aprovada.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2016 — Quem reservou o PC?

**ID reservado:** `anual-2016-nomes-parecidos` · **Tipo:** humor · **Complexidade preliminar:** media.

**O que acontece:** Dois clientes com apelidos muito semelhantes se apresentam para usar uma máquina e a fila fica confusa.

**Três respostas candidatas:** A) Conferir a ordem real de chegada; B) Perguntar qual estação foi combinada; C) Chamar cada um individualmente.

**Desdobramento a projetar:** Evitar troca de estação, fila e cobrança duplicada; sem reserva nova inventada.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2017 — O vídeo no meio do corredor

**ID reservado:** `anual-2017-gravacao-do-salao` · **Tipo:** cotidiano · **Complexidade preliminar:** baixa.

**O que acontece:** Um grupo quer gravar um vídeo curto dentro do salão enquanto pessoas passam e jogam.

**Três respostas candidatas:** A) Autorizar em área desocupada; B) Solicitar consentimento e regras; C) Pedir que gravem fora do salão.

**Desdobramento a projetar:** Convivência e consentimento; câmera não cria fama automática ou bloqueios permanentes.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2018 — O cliente esqueceu de sair do computador

**ID reservado:** `anual-2018-sessao-esquecida` · **Tipo:** servico · **Complexidade preliminar:** media.

**O que acontece:** Um visitante se levanta distraído antes do fim do tempo contratado, deixando a estação ainda reservada.

**Três respostas candidatas:** A) Avisar sobre o tempo restante; B) Manter a reserva até o contrato acabar; C) Encerrar conforme a regra atual se o cliente confirmar.

**Desdobramento a projetar:** Reaproveitar contratos e reservas existentes; nunca cobrar uma segunda sessão silenciosamente.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2019 — Uma avaliação injusta

**ID reservado:** `anual-2019-avaliacao-sem-contexto` · **Tipo:** cotidiano · **Complexidade preliminar:** baixa.

**O que acontece:** Chega ao conhecimento de Tony um comentário online sobre uma experiência que não parece corresponder ao atendimento real.

**Três respostas candidatas:** A) Responder educadamente; B) Rever o histórico da reclamação; C) Não dar destaque ao comentário.

**Desdobramento a projetar:** Confiança e reputação limitadas; não é reportagem de jornal nem multa.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2020 — Atendimento com hora combinada

**ID reservado:** `anual-2020-atendimento-com-hora` · **Tipo:** cotidiano · **Complexidade preliminar:** media.

**O que acontece:** Alguns moradores preferem combinar antes o horário de uso do computador. Uma mudança de rotina local, sem afirmar regra sanitária universal.

**Três respostas candidatas:** A) Organizar prioridade sem furar fila; B) Explicar lotação e limites reais; C) Manter ordem normal de chegada.

**Desdobramento a projetar:** Experimento narrativo sobre previsibilidade; reservas completas exigiriam desenho específico.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2021 — O microfone estava aberto!

**ID reservado:** `anual-2021-microfone-aberto` · **Tipo:** humor · **Complexidade preliminar:** baixa.

**O que acontece:** Durante uma chamada remota, o cliente descobre que todos ouviram uma conversa que ele pensava estar no mudo.

**Três respostas candidatas:** A) Orientar discretamente; B) Oferecer um local mais reservado, se existir; C) Manter o atendimento normal.

**Desdobramento a projetar:** Conforto e constrangimento breve; não gravar dados pessoais ou fala do usuário.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2022 — Um QR code apareceu no vidro

**ID reservado:** `anual-2022-adesivo-qr` · **Tipo:** imprevisto · **Complexidade preliminar:** baixa.

**O que acontece:** Tony percebe um adesivo com QR code sem identificação colado na entrada.

**Três respostas candidatas:** A) Retirar o adesivo; B) Investigar quem colocou; C) Colocar aviso para conferir links desconhecidos.

**Desdobramento a projetar:** Pequena ação preventiva; não simular transações Pix, clicar no link nem inventar fraude consumada.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2023 — O meme do Tony

**ID reservado:** `anual-2023-meme-do-tony` · **Tipo:** humor · **Complexidade preliminar:** baixa.

**O que acontece:** Um cliente faz uma piada carinhosa com uma expressão frequente do dono e a frase começa a circular.

**Três respostas candidatas:** A) Entrar na brincadeira; B) Pedir que mantenham o respeito; C) Ignorar e continuar trabalhando.

**Desdobramento a projetar:** Possíveis falas e reações sutis; nenhuma viralização ou dinheiro garantido.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2024 — Preciso de um PC potente para jogar na nuvem?

**ID reservado:** `anual-2024-jogo-na-nuvem` · **Tipo:** tecnologia · **Complexidade preliminar:** baixa.

**O que acontece:** Um visitante pergunta sobre jogos transmitidos pela internet, sem instalação local.

**Três respostas candidatas:** A) Explicar limitações da conexão; B) Sugerir jogos já licenciados; C) Anotar interesse em testar serviço futuro.

**Desdobramento a projetar:** Contraste entre internet e GPU; não instalar jogo, trocar licenças ou criar serviço automaticamente.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2025 — Saudade do monitor de tubo

**ID reservado:** `anual-2025-nostalgia-crt` · **Tipo:** humor · **Complexidade preliminar:** baixa.

**O que acontece:** Um antigo frequentador pede para ver os monitores CRT e relembra as máquinas antigas.

**Três respostas candidatas:** A) Mostrar equipamento ainda disponível; B) Contar a evolução do salão; C) Agradecer a lembrança.

**Desdobramento a projetar:** Falas condicionadas aos equipamentos reais, sem recolocar CRT que o jogador não tem.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2026 — O conselho da máquina estava errado

**ID reservado:** `anual-2026-resposta-automatica-errada` · **Tipo:** tecnologia · **Complexidade preliminar:** baixa.

**O que acontece:** Uma pessoa mostra uma resposta gerada automaticamente com instrução errada e pergunta se Tony pode ajudar a conferir.

**Três respostas candidatas:** A) Orientar a verificar com cuidado; B) Mostrar o procedimento que conhece; C) Explicar limites do atendimento.

**Desdobramento a projetar:** Humor e confiança; nenhum chatbot novo ou conteúdo de risco incorporado ao jogo.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2027 — O assistente confundiu a lan house

**ID reservado:** `anual-2027-assistente-que-confunde` · **Tipo:** humor · **Complexidade preliminar:** baixa.

**O que acontece:** Situação **fictícia de futuro próximo**: um aparelho de voz entende 'lan house' como uma casa comum e recomenda uma lâmpada.

**Três respostas candidatas:** A) Rir e corrigir o pedido; B) Ajudar a explicar o endereço; C) Continuar o atendimento.

**Desdobramento a projetar:** Easter egg futuro, sem afirmar lançamento real de produto nem oferecer hardware fictício.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2028 — Isso é um CD ou um espelho?

**ID reservado:** `anual-2028-cd-e-misterio` · **Tipo:** humor · **Complexidade preliminar:** baixa.

**O que acontece:** Situação **fictícia**: um visitante jovem pergunta para que servia a caixa de CDs guardada no balcão.

**Três respostas candidatas:** A) Mostrar um disco disponível; B) Explicar como eram os jogos; C) Convidar a conhecer o acervo do salão.

**Desdobramento a projetar:** Só exibir PS1/CD se existirem; fallback para relato do Tony, sem inventar estoque.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2029 — O bilhete guardado por anos

**ID reservado:** `anual-2029-recado-antigo` · **Tipo:** cotidiano · **Complexidade preliminar:** baixa.

**O que acontece:** Situação **fictícia**: surge uma mensagem antiga de agradecimento pela ajuda de Tony, mas não exige NPC persistente desde 1998.

**Três respostas candidatas:** A) Guardar no mural; B) Ler discretamente; C) Arquivar no balcão.

**Desdobramento a projetar:** Encerramento humano discreto, sem inventar histórico específico não registrado no save.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

### 2030 — O álbum da lan house

**ID reservado:** `anual-2030-album-do-balcao` · **Tipo:** legado · **Complexidade preliminar:** media.

**O que acontece:** No último ano, Tony encontra fotografias e anotações e decide o que recordar do estabelecimento, sem antecipar ou substituir o fim da campanha.

**Três respostas candidatas:** A) Relembrar os primeiros PCs; B) Rever momentos registrados na partida; C) Guardar o álbum e seguir atendendo.

**Desdobramento a projetar:** Resumo opcional apenas com estatísticas realmente persistidas; fim do jogo continua no último minuto de 2030.

**Situação:** ideia documentada; roteiro, efeitos numéricos, falas, arte e implementação ainda não aprovados.

## Contrato recomendado antes de implementar a primeira ficha

1. **Acontecer uma vez em cada ano jogado**, num dia variável da partida (por exemplo, um dia entre 45 e 310 do ano fictício), com hash determinístico de semente + ano + ID. Não consumir o RNG de clientes e não usar timers reais. Em 2000, 2004 e 2005, evitar as janelas históricas já existentes e manter distância razoável de cartas e retornos.
2. **Não depender de abrir o correio:** apresentar preferencialmente por um pequeno acontecimento observável no salão e registrar o resumo no histórico, com aviso/decisão simples só quando a escolha fizer sentido. Não entregar uma carta nova em todo mês.
3. **Nenhum acúmulo retroativo:** save que avança ou é restaurado a partir de 2020 não recebe as 22 cenas anteriores. Para saves antigos, introduzir o marcador com migração compatível, sem mudar os IDs das cartas anteriores.
4. **Fallback contextual:** se a cena menciona PS1, impressora, CRT, internet ou PC livre e o jogador não possui o recurso, usar a versão alternativa indicada (conversa/pergunta/lembrança), não forçar compras nem fabricar equipamentos.
5. **Efeitos verdadeiros e leves:** não criar pagamento ou visita do nada. Vendas, consumo, uso de PC, tempo de atendimento, débitos e reparos devem passar pelos comandos existentes. Reputação/moral, se alteradas, precisam de teto, balanço e justificativa. Nenhuma escolha gratuita implica lucro garantido.
6. **Não interromper o jogador em momento delicado:** nenhuma caixa modal durante compra, posicionamento, edição, restauração de save, campeonato, encerramento do dia ou atendimento crítico. Registrar um incidente pendente e mostrá-lo no próximo momento seguro **dentro do mesmo ano**. Evitar dias de colisão com eventos históricos; não ignorar silenciosamente anos inteiros.
7. **Uma história, um registro:** IDs estáveis `anual-AAAA-slug`; persistir disparo e resolução mesmo após compactar histórico, com proteção contra clique repetido, refresh e importação. Não alterar campos existentes sem migração e testes de compatibilidade.
8. **2030 é o limite:** último evento precisa acontecer antes do fim jogável e não acrescentar 2031 nem reiniciar o relógio.
9. **Não transformar rascunho em especificação sem aprovação:** antes de codificar, confirmar título, texto, escolhas, consequências numéricas, arte e integração. O jogador deve poder recusar sem punição desproporcional.
10. **Cobertura obrigatória por ficha:** ano correto, dia variado, unicidade, seed/RNG, save antigo/importado, modo histórico/clássico quando relevante, três escolhas, falta de caixa, ação idempotente, fallback sem item, conflitos com outras cenas, interface mobile/desktop e captura do runtime.

**Observação técnica:** o calendário do LHS possui 12 meses de 30 dias (360 dias por ano). A distribuição original de correspondências exige distância entre as primeiras cartas; os acontecimentos anuais devem ter um canal próprio, de menor peso, em vez de enfraquecer a regra das cartas existentes. É uma proposta de contrato; nenhum agendador é implementado neste PR.

## Sequência prática sugerida (um por vez)

**Primeira leva, sem mecânicas novas:** 1998 `cliente-ensina-tony`, 1999 `pagamento-em-moedas`, 2004 `chave-esquecida`, 2006 `adesivos-gabinete`, 2010 `pedido-de-wifi`, 2023 `meme-do-tony`. Começar com **1998**, implementando o fluxo anual reutilizável e uma cena leve; aprovar o resultado visual antes de ativar o próximo.

**Segunda leva, interação com funcionamento real:** 2000, 2002, 2003, 2005, 2016, 2018, 2020 e 2030. Exigem mais atenção a ocupação, histórico, saves e pausas.

**Terceira leva:** os demais anos, alternando humor, tecnologia e cotidiano para evitar monotonia. Nenhuma etapa inclui automaticamente mecânicas futuras de notebooks, Wi-Fi, QR, jogos em nuvem ou assistentes de voz.

### Checklist para mover uma ficha de ideia para pronta

- [ ] Texto/alternativas revisados e aprovados pelo criador.
- [ ] Pré-condições e fallback compatíveis com a época e equipamentos reais.
- [ ] Efeito real demonstrável sem receitas ou custos fantasmas.
- [ ] Disparo anual único, janela segura e ID persistido.
- [ ] Testes de simulação e saves; CI verde.
- [ ] Capturas desktop e mobile; revisão visual humana.
- [ ] Documentar implementação, commit/PR e marcar **somente a ficha correspondente** como entregue.

**Importante:** a aprovação ou implementação de uma ficha não transforma as 32 restantes em tarefas já autorizadas. Este catálogo pode ser revisto, substituído e expandido antes da codificação.
