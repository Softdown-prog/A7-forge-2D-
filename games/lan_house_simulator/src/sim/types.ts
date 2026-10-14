export type CustomerStage = "arriving" | "waiting" | "to_pc" | "sitting" | "using" | "standing" | "shopping" | "leaving";
export type Costume = "regular" | "clown" | "vampire" | "stitched-monster" | "rabbit" | "mouse-mascot";
export type Item = "soda" | "candy" | "snacks";

export interface Point { x: number; y: number }
import type { ActorDirection } from "../render/direction.js";

export interface Customer {
  id: number;
  x: number; y: number;
  stage: CustomerStage;
  /** Última orientação do deslocamento; persiste quando o cliente para. */
  facing?: ActorDirection;
  target: Point;
  /** Lugar atual na fila física; opcional para partidas anteriores. */
  queueIndex?: number;
  /** Waypoints seguintes ao target, serializáveis e opcionais para saves anteriores. */
  route?: Point[];
  /** Minutos de transição sentando/levantando. */
  poseMinutes?: number;
  wantsSnack?: boolean;
  needs?: {thirst:number;hunger:number;energy:number};
  /** Dinheiro pessoal fictício do visitante; não é o caixa do estabelecimento. */
  wallet?: number;
  desiredItem?: Item | null;
  /** No máximo uma bebida e um alimento por visita, inclusive após importar save. */
  purchasedDrink?: boolean;
  purchasedFood?: boolean;
  costume: Costume;
  /** Cliente VIP (opcional para saves antigos). */
  vip?: boolean;
  /** Prefere títulos 2005+; derivado do ID, sem sorteio adicional. */
  gpuGamer?: boolean;
  /** Sessão cobrada com adicional de jogo GPU; preservado em saves. */
  gpuGameCharged?: boolean;
  pcIndex: number | null;
  usedMinutes: number;
  /** Duração contratada na chegada; saves antigos usam 45 minutos. */
  sessionMinutes?: number;
  waitingMinutes: number;
  offlineWait: number;
  happy: boolean;
}
export interface StationAccount {
 sessions:number;vipSessions:number;sessionRevenue:number;vipRevenue:number;
 occupiedMinutes:number;energyShare:number;
}
/** Histórico acumulado, sem custos de peças, aluguel e compras de estoque. */
export interface Inventory { soda: number; candy: number; snacks: number }
export interface GameState {
  version: 1;
  totalMinutes: number;
  leftoverMinutes: number;
  rng: number;
  cash: number;
  revenue: number;
  expenses: number;
  /** Energia acumulada desde a última cobrança mensal (R$ fracionários). */
  energyAccrued?: number;
  /** Minutos-PC utilizados e disponíveis no mês atual: acumuladores de uso real. */
  monthPcUsedMinutes?: number;
  monthPcCapacityMinutes?: number;
  lastMonthPcUsedMinutes?: number;
  lastMonthPcCapacityMinutes?: number;
  /** Base de receita/despesa no início do mês para não contar dinheiro duas vezes. */
  monthRevenueBase?: number;
  monthExpensesBase?: number;
  lastMonthRevenue?: number;
  lastMonthExpenses?: number;
  /** Métricas opcionais; saves antigos começam a coletar após carregar. */
  stationLedger?: StationAccount[];
  reputation: number;
  /** 2 = modelo de preços histórico; ausência = save clássico. */
  economyVersion?:2;
  pricePerHour: number;
  /** Próximo atendimento disponível no balcão, em minutos de jogo. */
  counterBusyUntil?: number;
  /** Preços por produto, opcionais para saves antigos. */
  retailPrices?: Record<Item,number>;
  /** Nível de hardware por PC, 1 é o computador original. */
  pcTiers?: number[];
  /** Peças por estação; null/ausente usa a configuração CRT legada do nível. */
  pcComponents?: Array<import("./hardwareCatalog.js").PcComponents|null>;
  /** GPU por computador; ausente em saves anteriores. */
  pcGpus?: Array<"gpu05"|"gpu07"|"gpu09"|"gpu11"|"gpu13"|null>;
  pcLcdModels?: Array<"lcd05"|"lcd08"|"lcd12"|"lcd17"|"lcd24"|null>;
  /** Contrato de atacado opcional para saves antigos: 1 padrão, 2 parceiro. */
  supplierTier?: 1 | 2;
  /** Dia da última campanha; compatível com saves antigos. */
  promotionDay?: number;
  /** Versão do Windows por estação, independente do upgrade de hardware. */
  pcWindows?: Array<"win98"|"win2000"|"winxp"|"winvista"|"win7"|"win8"|"win10"|"win11">;
  /** Licenças pagas por PC; saves anteriores mantêm o Windows 98 preinstalado. */
  pcWindowsLicenses?: boolean[];
  internetTier: number;
  offlineUntil: number;
  licensedGames: boolean;
  /** Licenças avançadas por estabelecimento (opcional em saves antigos). */
  licensedGpuGames?: import("./gpuGames.js").GpuGameId[];
  expansionLevel: number;
  installedPcs?: number;
  /** Extensões de terreno independentes; ausentes em saves anteriores. */
  roomExtensions?: { west:number; east:number; south:number; north?:number };
  /** Segmentos de parede construídos no grid. */
  interiorWalls?: Array<{axis:"x"|"y";x:number;y:number}>;
  /** Portas internas em segmentos da grade, distintas de paredes sólidas. */
  interiorDoors?: Array<{axis:"x"|"y";x:number;y:number}>;
  /** Posições das estações adicionais nas alas ampliadas. */
  annexPcs?: Array<{slotId:string}>;
  furniture?: {poster:number;plant:number;table:number};
  furniturePlacements?: Array<{kind:"poster"|"plant"|"table";slotId:string;rotation?:0|1|2|3}>;
  /** Desgaste percentual por estação; saves antigos iniciam em zero. */
  pcWear?: number[];
  repairJobs?: import("./services.js").RepairJob[];
  binFill?: number[];
  cleaningJob?: import("./services.js").CleaningJob;
  inventory: Inventory;
  customers: Customer[];
  nextCustomerId: number;
  served: number;
  /** Eventos visuais transitórios de pagamento, drenados a cada frame. */
  paymentEffects?: Array<{amount:number;x:number;y:number}>;
  lostCustomers: number;
  purchases: number;
  /** Eventos de venda para que o áudio use a mercadoria correta, não um contador genérico. */
  saleEffects?: Array<{item:Item;amount?:number;x?:number;y?:number}>;
  /** Efeitos transitórios de início de digitação, disparados apenas ao começar a usar o PC. */
  keyboardEffects?: Array<{customerId:number;pcIndex:number}>;
  /** Falas temporárias; não afetam economia, descartadas pela UI. */
  speechEffects?: Array<{text:string;x:number;y:number;kind:"complaint"|"praise"}>;
  weather: "sun" | "rain";
  eventLog: string[];
  notices?: import("./notices.js").GameNotice[];
  lastDecisionDay?: number;
  /** Não permite sortear uma segunda vistoria elétrica na mesma partida. */
  electricalInspectionSeen?: boolean;
  /** Adequação da instalação concluída por profissional. */
  electricalWiringRegularized?: boolean;
  /** Dia limite contado a partir do pedido de prazo, não é data fixa de evento. */
  electricalDeadlineDay?: number;
  /** A prorrogação é única e opcional. */
  electricalExtensionUsed?: boolean;
  /** Autuação única, sem multas diárias repetidas. */
  electricalInspectionFineApplied?: boolean;
  contentFilterInstalled?: boolean;
  windowsNoticeFine?: boolean;
  copyrightNoticeFine?: boolean;
}
export interface Result { ok: boolean; message: string }
export const SESSION_MINUTES = 45;
export const DAY_MINUTES = 720;
export const OPEN_HOUR = 10;
export const GAME_SAVE_KEY = "lhs-save-v1";
