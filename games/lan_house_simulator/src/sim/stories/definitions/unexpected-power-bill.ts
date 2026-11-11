import type {StoryDefinition} from "../types.js";
import {choice,story} from "../builders.js";

/** Independent story catalogue entry: unexpected-power-bill. */
export const definition:StoryDefinition=story("Conta de luz acima do esperado",
  "A cobrança de energia veio muito acima do padrão. Pode haver leitura incorreta ou desperdício no salão.","problem",[
  choice("bill-electrician","Solicitar auditoria de consumo",135,"Profissional revisa medição e uso elétrico","good",{reputation:1}),
  choice("bill-contest","Contestar a fatura",35,"A concessionária fará reavaliação","mixed",{}),
  choice("bill-ignore","Pagar sem conferir a causa",90,"A origem do custo permanece desconhecida","bad",{reputation:-1})
 ],"A revisão encontrou desperdícios e reduziu a exposição a novas cobranças.",
 "A contestação teve resposta parcial; será preciso apresentar informações adicionais.",
 "A fatura seguinte trouxe outra diferença, comprometendo o orçamento do estabelecimento.");
