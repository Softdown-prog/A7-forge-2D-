import type {StoryDefinition} from "../types.js";
import {choice,story} from "../builders.js";

/** Independent story catalogue entry: gpu-games-2005. */
export const definition:StoryDefinition=story("2005: jogos avançados pedem placa de vídeo",
  "Alguns lançamentos já exigem placa de vídeo dedicada e um Windows compatível e licenciado. Tony percebeu que pode atrair um novo público, mas anunciar esses jogos não os instala: para licenciar um título avançado, a lan house precisa ter ao menos um computador com GPU e Windows adequados. Como se preparar?", "opportunity",[
  choice("gpu-plan", "Preparar divulgação para a nova geração", 90,
   "Divulgação só atrai público se houver jogo licenciado e PC compatível; não compra equipamentos","good",
   {reputation:1,visitors:1.06,visitorDays:8}),
  choice("gpu-survey", "Pesquisar interesse dos clientes", 20,
   "Pesquisa a procura, sem inventar clientes nem comprar licenças ou GPUs","mixed",
   {reputation:1,visitors:1.02,visitorDays:5}),
  choice("gpu-defer", "Adiar a entrada nos jogos avançados", 0,
   "Mantém o catálogo atual, sem cobrança nem punição por esperar","bad",{})
 ],"O plano de divulgação encontrou jogadores interessados. Para atendê-los, ainda será preciso instalar GPU e Windows compatíveis e comprar as licenças.",
 "A pesquisa mostrou curiosidade por jogos novos, mas os clientes querem saber quando haverá PCs preparados.",
 "Tony preferiu manter os jogos disponíveis. O novo segmento seguirá como uma possibilidade futura, sem obrigação de compra.");
