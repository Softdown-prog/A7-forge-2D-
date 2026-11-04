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
/** Complete help content migrated from the institutional site; Angular is the owner. */
export const faq=[
 ["O jogo é gratuito?","Sim. A campanha e a progressão são gratuitas. Cookies (biscoitos) permitem resgatar personalizações opcionais na Loja Cookies, em Minha Conta dentro do jogo. A conta opcional já permite gerenciar saves na nuvem."],
 ["Preciso instalar ou criar uma conta?","Não precisa instalar nem criar uma conta para jogar. O login é opcional para gerenciar saves na nuvem e necessário para receber Cookies ao apoiar o projeto em Donate. Não há assinatura obrigatória."],
 ["Funciona no celular?","Sim, a interface se adapta a telas menores e aceita toques. Para ver melhor o salão, você pode jogar com o aparelho na horizontal. Navegadores atuais com JavaScript e Canvas 2D são necessários; o desempenho depende do aparelho."],
 ["Como salvo minha partida?","O progresso fica neste navegador. No menu do jogo, use Salvar em arquivo para baixar um JSON. Use Carregar arquivo no outro aparelho ou navegador para continuar. Mantenha uma cópia antes de limpar dados ou mudar de endereço."],
 ["Posso misturar computadores antigos e novos?","Pode. Cada estação tem suas próprias peças, sistema operacional, placa de vídeo e monitor. Novas opções aparecem com os anos, e você decide onde investir."],
 ["O dinheiro do jogo vale dinheiro real?","Não. Caixa, mercadorias, salários e preços pertencem à simulação. O jogo não promete ganhos reais nem substitui orientação profissional de gestão."],
 ["O que faço se ficar lento?","Feche abas pesadas, use um navegador atualizado e reduza outras tarefas do aparelho. Para informar um problema, anote navegador, modelo do dispositivo e o que estava acontecendo; não envie documentos ou dados pessoais em relatos públicos."]
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
