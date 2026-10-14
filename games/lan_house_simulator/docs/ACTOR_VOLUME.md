# Volume desenhado nos personagens — 14/10/2026

O personagem continua procedural em Canvas 2D. A sensação de corpo vem da silhueta, da sobreposição e dos planos de luz: não é necessário converter o jogo para 3D para obter este resultado.

## Alterações

- Ombros, tórax, barriga e quadril ganham curvas e uma lateral sombreada ampla, mantendo altura, paletas, rostos e figurinos.
- Os perfis deixam de usar compressão horizontal de 0,79. Possuem contorno próprio, peito projetado e braço próximo desenhado à frente do corpo, com o outro atrás.
- Coxas, panturrilhas, mangas e mãos ficam mais cheias, com luz e sombra acompanhando seus segmentos. Costuras discretas deixam de ter contornos que pareciam placas rígidas.
- Cabeça recebe orelhas frontais, luz de bochecha, sombra sob o queixo e nuca arredondada com iluminação, preservando as feições e acessórios.
- A altura e as posições de chão/assento permanecem iguais. O hitbox do dono acompanha a largura maior. Reservas, rotas, colisões da simulação, relógio, poses e saves não mudam.

O desenho atende clientes e dono, incluindo os seis figurinos de clientes existentes. Técnico e faxineiro usam um desenho separado e não fazem parte desta alteração.

## Revisão

```sh
npm test
npm run audit
node scripts/capture_actor_volume.mjs out/actor-volume
node scripts/capture_scene.mjs out/actor-volume/scene
node scripts/record_gameplay.mjs out/actor-volume/live
node scripts/profile_runtime.mjs out/actor-volume/performance volume
```

A prancha usa `drawActor` da produção no Chromium, sem ilustrar uma promessa separada do jogo. `capture_actor_volume.mjs` inspeciona 336 combinações de figurino, direção, pose e transição; verifica desenho presente e limites da superfície. Gera quatro direções, poses e relatório JSON. O worker de cena também executa a inspeção. Opcionalmente aceita um módulo `actorArt.js` anterior como terceiro argumento para desenhar a comparação na mesma câmera.

A suíte completa passou com 167 testes e auditoria estática. A atualização posterior da informação de GPUs foi integrada preservando o desenho e validada pelos testes de GPU e novas capturas da cena. O fundo continua usando o cache da otimização anterior; os novos planos do tronco cabem na própria silhueta e evitam um recorte de Canvas adicional por personagem.

As capturas da cena real e o vídeo validam as proporções junto ao balcão, computadores e cadeira. O perfil de desempenho serve para conferir o custo após a melhoria de fluidez anterior; FPS varia por aparelho e carga do sistema. A revisão em telefone físico e a aprovação artística final continuam pendentes.

Perfil local de 12 segundos na mesma fixture de circulação: desktop **60 FPS**, desenho médio **1,31 ms**; viewport móvel com CPU limitada em 4× **34,3 FPS**, desenho médio **6,46 ms**, intervalo de frame P95 **33,4 ms**. Isto é uma emulação controlada, não uma medição em telefone físico. O desenho mais volumoso tem custo adicional; a apresentação intermediária e o cache continuam ativos.
