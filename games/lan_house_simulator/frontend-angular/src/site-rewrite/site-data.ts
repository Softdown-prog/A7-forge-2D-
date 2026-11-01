/** Self-contained content for the new Angular site; never imported from website/*.mjs. */
export const navigation=[
 {href:'/',label:'Início'},{href:'/jogar/',label:'Jogar'},
 {href:'/sobre-o-jogo/',label:'O jogo'},{href:'/sobre-nos/',label:'Sobre nós'},
 {href:'/ajuda/',label:'Ajuda'},{href:'/contato/',label:'Contato'},
 {href:'/conta/',label:'Minha conta'},{href:'/donate/',label:'Donate'}
] as const;
export const footerLinks=[
 {href:'/termos/',label:'Termos de uso'},{href:'/privacidade/',label:'Privacidade'},
 {href:'/dados/',label:'Dados locais'}
] as const;
export const eras=[
 {year:'1998',title:'Três PCs e um sonho.',text:'Um pequeno salão com monitores CRT e internet discada.',image:'/assets/pc-crt.svg'},
 {year:'2005',title:'O LCD chega ao bairro.',text:'Novos computadores e uma nova geração de telas.',image:'/assets/pc-lcd.svg'},
 {year:'2012',title:'Mais espaço para crescer.',text:'Mais opções de hardware, serviços e investimentos.',image:'/assets/pc-led.svg'},
 {year:'2024',title:'O salão vira uma arena.',text:'Equipamentos modernos convivem com máquinas clássicas.',image:'/assets/pc-arena.svg'}
] as const;
export const faq=[
 ['O jogo é gratuito?','Sim. A campanha é gratuita e Cookies são opcionais para personalizações.'],
 ['Preciso instalar ou criar conta?','Não precisa instalar ou criar conta para jogar. A conta é opcional.'],
 ['Funciona no celular?','Sim, o jogo pode ser usado em navegadores modernos com suporte a Canvas 2D.'],
 ['Como salvo minha partida?','Use Salvar em arquivo no menu do jogo e guarde o arquivo antes de limpar os dados.'],
 ['Posso usar computadores antigos e novos?','Sim. A decisão de modernizar cada estação é sua.'],
 ['O dinheiro do jogo é real?','Não. Todos os valores pertencem à simulação.'],
 ['O que faço se o jogo ficar lento?','Feche abas pesadas e teste um navegador atualizado.']
] as const;
export const validPaths=[
 '/','/jogar/','/sobre-o-jogo/','/sobre-nos/','/ajuda/','/contato/','/conta/',
 '/conta/confirmar/','/donate/','/termos/','/privacidade/','/dados/','/404/'
] as const;
export type SitePath=typeof validPaths[number];
export function pathOf(path:string):SitePath{
 const normalized=path.replace(/\/+/g,'/').replace(/\/?$/,'/');
 return (validPaths as readonly string[]).includes(normalized)?normalized as SitePath:'/404/';
}
export function normalizeSearch(input:string):string{
 return input.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR')
 .replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}
