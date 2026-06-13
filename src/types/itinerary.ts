/* ========================================
   攻略数据类型定义
   ======================================== */

export interface TicketInfo {
  type: '免费' | '收费';
  price?: string;  // 如 "60元/人"
}

export interface Spot {
  id: string;
  name: string;
  description: string;
  duration: string;
  transport?: {
    mode: string;    // 地铁/步行/公交/打车/共享单车（城内）/ 高铁/火车/飞机/自驾（城际）
    duration: string; // 通行时长
  };
  tags?: string[];
  isTransit?: boolean;  // true=城际交通（高铁/火车/飞机），false/undefined=普通景点
  recommendReason?: string;  // 推荐理由，150-200字
  ticketInfo?: TicketInfo;   // 门票信息
}

export interface TimeSlot {
  id: string;
  label: string;     // 上午/下午/晚上
  spots: Spot[];
}

export interface Day {
  dayNumber: number;
  title: string;
  date: string;
  slots: TimeSlot[];
  tips?: string[];
}

export interface Budget {
  transport: number;    // 大交通（往返，单程×2，含所有出行方式）
  hotel: number;
  food: number;
  tickets: number;
  other: number;
}

export interface PracticalInfo {
  transport: string;
  accommodation: string;
  budget: Budget;
  userNotes?: {
    transport?: string;
    accommodation?: string;
    budgetNote?: string;
  };
}

export interface ItineraryMeta {
  companions?: string;
  travelDate?: string;
  preferences?: string;
  departure?: string;
  destination?: string;
  days?: string;
  budget?: string;
}

export interface ItineraryData {
  id: string;
  title: string;
  days: Day[];
  practicalInfo: PracticalInfo;
  notices: string[];
  createdAt: string;
  metadata?: ItineraryMeta;
}

export const TRANSPORT_ICONS: Record<string, string> = {
  地铁: '🚇',
  步行: '🚶',
  公交: '🚌',
  打车: '🚕',
  共享单车: '🚲',
  高铁: '🚄',
  火车: '🚃',
  飞机: '✈️',
  自驾: '🚗',
  长途大巴: '🚌',
  动车: '🚄',
};

export const TRANSPORT_MODES = ['地铁', '步行', '公交', '打车', '共享单车'];