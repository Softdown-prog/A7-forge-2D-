# Recuperação do save local — LHS etapa 1

A chave principal `lhs-save-v1` e o JSON exportado continuam iguais. Sem backend adicional.
- `loadLocalSave` valida a partida antes de liberar Continuar; se estiver inválida, tenta `lhs-save-v1-backup`. Uma mensagem explica o resultado sem apagar automaticamente o JSON danificado.
- `writeLocalSave` grava o principal e mantém um checkpoint anterior. O backup é atualizado na primeira oportunidade e depois apenas quando o dia do jogo avançou; falha de cota do backup não impede tentar gravar o principal.
- `replaceLocalSave` grava uma partida substituta antes de eliminar o backup anterior. Nova partida, reinício, importação e restauração não reaproveitam backups obsoletos.
- `tests/local-save-recovery.test.mjs` exercita corrupção, recuperação, falha de escrita, nova partida, importação e rotação da cópia.

Backup é local ao navegador e não substitui exportação manual do JSON. Pendente revisão física desktop/mobile e estudo de quota em partidas grandes.

## Fechamento técnico automatizado — 15/10/2026
- A leitura do backup é independente da chave principal. Se a leitura da chave principal for bloqueada, ainda é tentada a recuperação pelo checkpoint; se a leitura do backup falhar durante a rotação, o save principal continua sendo gravado.
- O jogo mostra uma mensagem acessível de erro no HUD quando o navegador rejeita a gravação; em telas móveis, a mensagem aparece mesmo com o indicador normal oculto. Ao restaurar o armazenamento, o indicador confirma a gravação.
- `tests/local-save-recovery.test.mjs` verifica falhas isoladas de leitura, recuperação após corrupção, checkpoints em múltiplas épocas (1998–2030), dados econômicos/opcionais e o limite final do calendário. Trata-se de testes com estados de campanhas longas; não equivale a simular cada minuto de 33 anos.
- `scripts/verify_save_recovery.mjs` abre o jogo real em Chromium (1280, 414, 360 px), carrega uma cópia válida após corrupção, exporta arquivo, força falha de quota e verifica alerta visível e novo salvamento após recuperação. Executado pelo worker de cena do GitHub Actions.
- Os limites de armazenamento são definidos pelo navegador/dispositivo. O limite interno para JSON local permanece em 2 MB, e a cópia local não substitui o arquivo de exportação manual.
- **Pendente em aparelho físico:** testar alertas em Android/iOS com pouco espaço e em modo privado, fechar/reabrir o navegador durante uma partida longa, exportar/importar o JSON no dispositivo e avaliar legibilidade/gestos em telas pequenas.
