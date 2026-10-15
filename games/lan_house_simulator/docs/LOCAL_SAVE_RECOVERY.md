# Recuperação do save local — LHS etapa 1

A chave principal `lhs-save-v1` e o JSON exportado continuam iguais. Sem backend adicional.
- `loadLocalSave` valida a partida antes de liberar Continuar; se estiver inválida, tenta `lhs-save-v1-backup`. Uma mensagem explica o resultado sem apagar automaticamente o JSON danificado.
- `writeLocalSave` grava o principal e mantém um checkpoint anterior. O backup é atualizado na primeira oportunidade e depois apenas quando o dia do jogo avançou; falha de cota do backup não impede tentar gravar o principal.
- `replaceLocalSave` grava uma partida substituta antes de eliminar o backup anterior. Nova partida, reinício, importação e restauração não reaproveitam backups obsoletos.
- `tests/local-save-recovery.test.mjs` exercita corrupção, recuperação, falha de escrita, nova partida, importação e rotação da cópia.

Backup é local ao navegador e não substitui exportação manual do JSON. Pendente revisão física desktop/mobile e estudo de quota em partidas grandes.
