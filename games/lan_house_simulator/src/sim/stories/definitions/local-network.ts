import type {StoryDefinition} from "../types.js";
import {choice,story} from "../builders.js";

/** Independent story catalogue entry: local-network. */
export const definition:StoryDefinition=story("Rede local dos PCs instável",
  "Computadores deixaram de se comunicar direito; jogos e serviços em rede começaram a falhar.","problem",[
  choice("lan-technician","Contratar técnico de redes",145,"Reorganiza cabos e testa conectividade","good",{reputation:1}),
  choice("lan-restart","Reconfigurar a rede",50,"Melhora temporariamente a conectividade","mixed",{offlineMinutes:8}),
  choice("lan-ignore","Ignorar as falhas de rede",0,"Mais sessões podem ser interrompidas","bad",{offlineMinutes:55,reputation:-3,visitors:.93,visitorDays:6})
 ],"Os computadores voltaram a se comunicar de forma estável.",
 "Uma parte das máquinas funciona, mas as partidas em rede ainda sofrem quedas.",
 "A falha atingiu mais sessões, causando abandono e reclamações de clientes.");
