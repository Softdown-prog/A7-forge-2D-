# Engasgos durante a partida — 18/10/2026

O perfil da partida com toque e CPU limitada em 4× mostrou custo de desenho dos personagens, mesmo com a administração fechada. Separar os painéis reduziu o trabalho da interface, mas não eliminou centenas de operações vetoriais de cada personagem a cada desenho.

`actorSprites.ts` reutiliza quadros da arte original para clientes parados, caminhando e usando PC/console. `actorSpriteWorker.ts` prepara esses quadros em um Worker com superfícies OffscreenCanvas reutilizadas. A preparação não bloqueia a tarefa que atende animação, rolagem e entrada. Enquanto um quadro não está pronto, o desenho vetorial original continua disponível imediatamente.

As posições continuam interpoladas a cada desenho, independentemente do quadro reutilizado. As 32 fases por ciclo mantêm a fase individual da caminhada/digitação. A identidade completa não entra na chave: os quatro estilos casuais e as fantasias podem compartilhar quadros entre clientes. Direção, pose, controle e assento de console fazem parte da chave. O menu e a partida compartilham um único cache e um único Worker. No site, a URL do Worker recebe a mesma revisão dos módulos da partida para evitar misturar versões em cache.

O cache tem orçamento de 16 MiB de pixels RGBA, com descarte LRU e `ImageBitmap.close()`. Há no máximo 64 preparações pendentes. Isso limita o trabalho e a memória ao longo da campanha. Não é um limite sobre toda a memória do processo do navegador.

### Margens transparentes — revisão de 18/10/2026

O Worker recorta somente pixels transparentes em volta de cada quadro, mantendo dois pixels de margem e a âncora original. O cache contabiliza as dimensões reais de cada bitmap, em vez de reservar 72 × 120 pixels para todos os quadros. Não há redução da resolução da arte nem das 32 fases. A verificação cobre também pressão de memória e fechamento dos bitmaps descartados.

Comparação do commit de produção `52d56c6` com o recorte, no mesmo runner Chromium, toque em 414 × 920 e CPU limitada em 4×, com amostragem de CPU e janelas de 12 segundos:

| Cenário | Quadros descartados antes → depois | P95 do desenho antes → depois |
| --- | --- | --- |
| Salão com divisórias | 611 → 71 | 7,6 → 7,8 ms |
| PC reposicionado | 236 → 0 | 6,3 → 6,5 ms |
| Fila com seis fantasias | 444 → 14 | 7,0 → 6,3 ms |

O ganho principal é reter animações prontas e evitar refazê-las; as pequenas diferenças de desenho variam entre cenários. Esse ajuste de renderização não corrige bloqueios lógicos de circulação, tratados separadamente em `RUNTIME_PERFORMANCE.md`. O workflow `lhs-mobile-performance.yml` guarda perfis JSON e a comparação visual para revisão.

Dono, funcionários, transições de sentar/levantar, zoom acima de 1× e efeitos premium continuam no artista vetorial contínuo. Navegadores sem Worker/OffscreenCanvas, ou que bloqueiem o carregamento do Worker, usam o mesmo caminho original. A economia, o relógio, as rotas, o RNG e os saves não são alterados.

## Verificação

- `npm test`: compilação e regressões da simulação.
- `node scripts/verify_actor_sprites.mjs`: comparação com o artista original em 288 combinações de fantasia, direção, pose e zoom, movimento contínuo, animação, compartilhamento por identidade e funcionamento com Worker ausente/bloqueado. Gera uma folha de comparação visual.
- `node scripts/verify_rendering.mjs`, `verify_worker_motion.mjs`, `verify_management_panels.mjs` e `verify_live_site_preview.mjs`: fundo, ações dos funcionários e administração/rolagem móvel.
- `node scripts/profile_stutter.mjs out/stutter control --vector`, seguido de `node scripts/profile_stutter.mjs out/stutter optimized`: executa a partida real com toque em 414 × 920 px e CPU em 4×. O controle troca somente a chamada do artista de personagens; mantém o restante do código. `--cpu-profile` inclui amostragem de CPU, com custo adicional de instrumentação.

Na comparação sem amostragem de CPU, em janelas de 12 s:

| Cenário | Pausas ≥ 50 ms antes → depois | P95 do desenho antes → depois | Desenhos da cena antes → depois |
| --- | --- | --- | --- |
| Salão expandido, lotado e com divisórias | 21 → 2 | 13,8 → 9,2 ms | 315 → 359 |
| Salão com PC reposicionado | 51 → 6 | 14,3 → 8,1 ms | 270 → 356 |

O limite de 30 desenhos/s no toque continua ativo; os callbacks do navegador não são a mesma coisa que desenhos da cena. Os resultados são de Chromium com CPU limitada, não de um aparelho físico. Ainda ocorreram pausas: a alteração reduz o trabalho observado, sem prometer eliminar todo engasgo em qualquer aparelho.
