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
  /** Waypoints seguintes ao target, serializáveis e opcionais para saves anteriores. */
  route?: Point[];
  /** Minutos de transição sentando/levantando. */
  poseMinutes?: number;
  wantsSnack?: boolean;
  needs?: {thirst:number;hunger:number;energy:number};
  /** Dinheiro pessoal fictício do visitante; não é o caixa do estabelecimento. */
  wallet?: number;
  desiredItem?: Item | null;
  costume: Costume;
  pcIndex: number | null;
  usedMinutes: number;
  /** Duração contratada na chegada; saves antigos usam 45 minutos. */
  sessionMinutes?: number;
  waitingMinutes: number;
  offlineWait: number;
  happy: boolean;
}
export interface Inventory { soda: number; candy: number; snacks: number }
export interface GameState {
  version: 1;
  totalMinutes: number;
  leftoverMinutes: number;
  rng: number;
  cash: number;
  revenue: number;
  expenses: number;
  reputation: number;
  pricePerHour: number;
  /** Contrato de atacado opcional para saves antigos: 1 padrão, 2 parceiro. */
  supplierTier?: 1 | 2;
  internetTier: number;
  offlineUntil: number;
  licensedGames: boolean;
  expansionLevel: number;
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
  /** Falas temporárias; não afetam economia, descartadas pela UI. */
  speechEffects?: Array<{text:string;x:number;y:number;kind:"complaint"|"praise"}>;
  weather: "sun" | "rain";
  eventLog: string[];
}
export interface Result { ok: boolean; message: string }
export const SESSION_MINUTES = 45;
export const DAY_MINUTES = 720;
export const OPEN_HOUR = 10;
export const GAME_SAVE_KEY = "lhs-save-v1";
