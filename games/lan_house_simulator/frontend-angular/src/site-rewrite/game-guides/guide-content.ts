import type {GameGuide,GameGuideGroup} from './guide-types';
import {guidesAC} from './guides-a-c';
import {guidesDH} from './guides-d-h';
import {guidesIL} from './guides-i-l';
import {guidesMO} from './guides-m-o';

export const GAME_GUIDES:readonly GameGuide[]=[
 ...guidesAC,
 ...guidesDH,
 ...guidesIL,
 ...guidesMO
];

const GROUP_DESCRIPTIONS:Readonly<Record<string,string>>={
 A:'Como abrir as portas em 1998, entender o relógio das 10:00 às 22:00, atender no balcão e localizar todos os painéis.',
 B:'Expansão até 22 computadores, kits geracionais, 52 peças avulsas, fontes de alimentação, monitores LCD/LED/IPS/Arena, reparos e contabilidade por máquina.',
 C:'Diferença entre Windows preinstalado e licenciado, requisitos do Windows 98 ao 11, vistorias fiscais e instalação em tempo real.',
 D:'Descoberta do Linux no fórum da cidade em 1999, assinatura das 6 revistas Informática Livre e operação das estações Linux.',
 E:'Catálogo das 13 placas de vídeo PixelForce (2005–2030), exigência de fonte, licenciamento e download dos jogos avançados com GPU.',
 F:'Contrato básico de regularização, os 10 jogos clássicos de 1998–1999 e as partidas multiplayer em rede local de Setor Zero (2000).',
 G:'Evolução da internet Discada para Via rádio e Fibra óptica, duração das quedas de sinal e banda compartilhada de downloads.',
 H:'Compra e operação das bancadas de PlayStation 1 (2002) e PlayStation 2 (2006), tarifas horárias e catálogo de 28 CDs e DVDs.',
 I:'Como funcionam as 28 edições trimestrais da revista Top Games (2002–2010) entregues pelo carteiro e o desbloqueio de jogos de console.',
 J:'Comparativo dos 4 fornecedores de estoque, prazos de entrega, necessidades de sede e fome e o catálogo detalhado de 12 mercadorias (2000+).',
 K:'Acúmulo de lixo, faxineiro e técnico (avulso vs. equipe fixa), Impressora de balcão e Copiadora de CD e DVD.',
 L:'Economia histórica pelo IPCA (1998–2030), idade tecnológica e teto da tarifa, fechamento mensal de 30 dias, divulgação e reputação.',
 M:'Os 4 perfis comportamentais de clientes, paciência na fila do balcão e como atrair Clientes VIP que pagam +25% por sessão.',
 N:'Obras de ampliação da sala principal e anexos, paredes divisórias, portas internas, decoração, editor Organizar salão e Passagens.',
 O:'Caixa de entrada do Correio, 12 histórias interativas do bairro, Corujão de sexta-feira com Galeria de troféus, salvamento JSON, Dados locais, Minha Conta e Loja Cookies.'
};

export const GAME_GUIDE_GROUPS:readonly GameGuideGroup[]=
 ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'].map(code=>{
  const guides=GAME_GUIDES.filter(item=>item.groupCode===code);
  return {
   code,
   title:guides[0]?.groupTitle??code,
   description:GROUP_DESCRIPTIONS[code]??'',
   guides
  };
 });

const byPath=new Map<string,GameGuide>(GAME_GUIDES.map(guide=>[guide.path,guide]));
const byId=new Map<string,GameGuide>(GAME_GUIDES.map(guide=>[guide.id,guide]));

export function findGuideByPath(path:string):GameGuide|null{
 return byPath.get(path)??null;
}

export function findGuideById(id:string):GameGuide|null{
 return byId.get(id)??null;
}

export function adjacentGuides(guide:GameGuide):{readonly previous:GameGuide|null;readonly next:GameGuide|null}{
 const index=guide.number-1;
 return {
  previous:index>0?(GAME_GUIDES[index-1]??null):null,
  next:index+1<GAME_GUIDES.length?(GAME_GUIDES[index+1]??null):null
 };
}

export function relatedGuidesFor(guide:GameGuide):readonly GameGuide[]{
 return guide.relatedIds
  .map(id=>byId.get(id))
  .filter((item):item is GameGuide=>item!==undefined);
}
