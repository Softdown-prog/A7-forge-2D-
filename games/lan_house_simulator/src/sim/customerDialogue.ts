/**
 * Falas curtas dos visitantes do LHS.
 * Nunca usa o RNG da simulação nem altera a satisfação ou o caixa.
 * Contexto preservado: clientes não elogiam após reclamação nem
 * reclamam de preço quando o que falhou foi a internet.
 */
export type ComplaintReason="queue"|"outage"|"slow-internet"|"wait"|"price";
export const PRAISE_LINES=[
 "Curti demais!",
 "PC voando hoje!",
 "Atendimento nota dez!",
 "Volto com certeza!",
 "Que lugar bacana!",
 "Jogatina foi boa!"
] as const;
export const COMPLAINT_LINES:Record<ComplaintReason,readonly string[]>={
 queue:["Que fila enorme!","Essa fila não anda!","Cadê um PC livre?"],
 outage:["Internet caiu!","Conexão tá instável!","Assim não dá pra jogar!"],
 "slow-internet":["Internet lenta!","Conexão tá instável!","Assim não dá pra jogar!"],
 wait:["Demorou demais!","Essa fila não anda!","Cadê um PC livre?"],
 price:["Está caro!","Esse preço tá salgado!"]
};
/** Indexado pelo ID já existente do cliente: falas variadas sem consumo de RNG. */
export function praiseLine(customerId:number):string{
 return PRAISE_LINES[Math.abs(Math.trunc(customerId))%PRAISE_LINES.length]!;
}
export function complaintLine(reason:ComplaintReason,customerId:number):string{
 const lines=COMPLAINT_LINES[reason];
 return lines[Math.abs(Math.trunc(customerId))%lines.length]!;
}
