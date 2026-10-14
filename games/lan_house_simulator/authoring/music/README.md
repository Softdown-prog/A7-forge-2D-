# LHS — protótipos musicais originais

**Status: em avaliação, não aprovados e não incluídos no runtime do jogo.**

## Luzes de Outubro — v1 (14/10/2026)

- **Duração da prévia renderizada:** 29,24 s; **tempo:** 104 BPM; 4/4; 12 compassos.
- **Proposta:** rock leve, melódico, romântico e nostálgico; guitarra limpa em destaque, violão/guitarra dedilhada, baixo discreto, bateria leve e pad muito sutil. Sem vocal.
- **Fonte musical autoral:** `luzes_de_outubro_v1.json` registra todos os 60 eventos da melodia principal, o voicing de cada acorde e o padrão básico de acompanhamento, permitindo mudar os instrumentos e regenerar versões futuras.
- **Produção da demonstração:** síntese numérica determinística (sem copiar melodias existentes, sem arquivos de gravação ou samples comerciais). O MP3/OGG de audição foi entregue ao criador no chat. A renderização ainda não foi transformada em pipeline CI do repositório.
- **Direitos:** autoria musical independente, sujeita a revisão auditiva de similaridade e aprovação humana antes de qualquer lançamento. Não existe garantia automática de ausência de coincidências com obras preexistentes.
- **Integração:** **não** colocar a música em `src/audio/soundscape.ts`, não adicionar autoplay, não misturar com os efeitos já aprovados sem pedido explícito. Futuramente a versão aprovada poderá ser disponibilizada como arquivo OGG/MP3 opcional, com opção de volume separado e controles de ligar/desligar.

Este diretório contém receitas de criação, **não assets autorizados para publicação**. Preservar a estrutura e os efeitos existentes do LHS.
