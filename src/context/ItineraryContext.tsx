import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { ItineraryData, Day, TimeSlot, Spot } from '../types/itinerary';

/* ========================================
   Itinerary Context — 攻略数据状态管理
   ======================================== */

let spotIdCounter = 0;
let slotIdCounter = 0;
let dayIdCounter = 0;

export function generateSpotId() {
  spotIdCounter += 1;
  return `spot_${spotIdCounter}`;
}

export function generateSlotId() {
  slotIdCounter += 1;
  return `slot_${slotIdCounter}`;
}

export function generateDayNumber() {
  dayIdCounter += 1;
  return dayIdCounter;
}

/* ========================================
   Mock 数据 — 5天4夜成都自由行
   ======================================== */

const mockItinerary: ItineraryData = {
  id: 'iti_001',
  title: '5天4夜 成都自由行攻略',
  days: [
    {
      dayNumber: 1,
      title: '经典市区游',
      date: '第 1 天',
      slots: [
        {
          id: generateSlotId(),
          label: '上午',
          spots: [
            {
              id: generateSpotId(),
              name: '成都大熊猫繁育研究基地',
              description: '近距离观看可爱的大熊猫，建议早上前往，熊猫最活跃。基地内还有熊猫博物馆和科普影院。',
              duration: '3小时',
              transport: { mode: '地铁', duration: '40分钟' },
              tags: ['景点', '亲子'],
              recommendReason: '作为全球最大的大熊猫人工繁育基地，这里是近距离接触国宝的最佳场所。清晨的熊猫最为活跃，你可以看到它们在竹林中嬉戏打闹、啃竹子的可爱模样。基地环境优美如公园，适合亲子家庭悠闲漫步一上午。',
              ticketInfo: { type: '收费', price: '55元/人' },
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '下午',
          spots: [
            {
              id: generateSpotId(),
              name: '宽窄巷子',
              description: '成都最具代表性的历史文化街区，由宽巷子、窄巷子和井巷子组成，集美食、购物、文化于一体。',
              duration: '2小时',
              transport: { mode: '地铁', duration: '30分钟' },
              tags: ['美食', '文化'],
            },
            {
              id: generateSpotId(),
              name: '人民公园',
              description: '体验成都慢生活，去鹤鸣茶社喝盖碗茶，看当地人打麻将、掏耳朵，感受市井文化。',
              duration: '1.5小时',
              transport: { mode: '步行', duration: '10分钟' },
              tags: ['文化', '休闲'],
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '晚上',
          spots: [
            {
              id: generateSpotId(),
              name: '锦里古街',
              description: '夜晚的锦里灯火璀璨，品尝各种成都小吃，购买特色手工艺品，感受三国文化氛围。',
              duration: '2小时',
              transport: { mode: '打车', duration: '15分钟' },
              tags: ['美食', '夜景'],
            },
          ],
        },
      ],
      tips: ['建议早点出发去熊猫基地，熊猫上午最活跃', '宽窄巷子和人民公园距离很近，可以步行游览'],
    },
    {
      dayNumber: 2,
      title: '文化与历史',
      date: '第 2 天',
      slots: [
        {
          id: generateSlotId(),
          label: '上午',
          spots: [
            {
              id: generateSpotId(),
              name: '武侯祠',
              description: '纪念诸葛亮的祠庙，中国唯一的君臣合祀祠庙，感受三国文化的厚重底蕴。',
              duration: '2小时',
              transport: { mode: '地铁', duration: '25分钟' },
              tags: ['文化', '历史'],
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '下午',
          spots: [
            {
              id: generateSpotId(),
              name: '杜甫草堂',
              description: '诗人杜甫的故居，幽静的园林式博物馆，感受诗圣的文学气息和唐代文化。',
              duration: '2小时',
              transport: { mode: '公交', duration: '20分钟' },
              tags: ['文化', '历史'],
            },
            {
              id: generateSpotId(),
              name: '四川博物院',
              description: '收藏有大量巴蜀文物，包括青铜器、陶瓷、书画等，免费参观，文化爱好者的宝库。',
              duration: '2小时',
              transport: { mode: '步行', duration: '15分钟' },
              tags: ['文化'],
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '晚上',
          spots: [
            {
              id: generateSpotId(),
              name: '九眼桥',
              description: '成都著名的酒吧街，沿河两岸灯火辉煌，是体验成都夜生活的好去处。',
              duration: '2小时',
              transport: { mode: '打车', duration: '15分钟' },
              tags: ['夜景', '休闲'],
            },
          ],
        },
      ],
      tips: ['武侯祠和锦里相邻，可以安排在一起游览'],
    },
    {
      dayNumber: 3,
      title: '美食与休闲',
      date: '第 3 天',
      slots: [
        {
          id: generateSlotId(),
          label: '上午',
          spots: [
            {
              id: generateSpotId(),
              name: '文殊院',
              description: '川西著名佛教寺院，免费开放，可以在院内茶馆喝茶，品尝著名的文殊院素斋。',
              duration: '2小时',
              transport: { mode: '地铁', duration: '20分钟' },
              tags: ['文化', '休闲'],
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '下午',
          spots: [
            {
              id: generateSpotId(),
              name: '春熙路',
              description: '成都最繁华的商业街，IFS 国际金融中心和太古里都在此，购物与美食的天堂。',
              duration: '3小时',
              transport: { mode: '地铁', duration: '15分钟' },
              tags: ['购物', '美食'],
            },
            {
              id: generateSpotId(),
              name: '太古里',
              description: '开放式街区购物中心，传统川西建筑风格与现代商业完美融合，网红打卡地。',
              duration: '2小时',
              transport: { mode: '步行', duration: '5分钟' },
              tags: ['购物', '美食'],
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '晚上',
          spots: [
            {
              id: generateSpotId(),
              name: '建设巷小吃街',
              description: '成都本地人最爱的夜市，烤猪蹄、锅巴土豆、降龙爪爪等网红小吃汇聚。',
              duration: '2小时',
              transport: { mode: '地铁', duration: '20分钟' },
              tags: ['美食'],
            },
          ],
        },
      ],
      tips: ['春熙路和太古里紧邻，步行即可穿梭', '建设巷小吃街建议空腹前往'],
    },
    {
      dayNumber: 4,
      title: '周边深度游',
      date: '第 4 天',
      slots: [
        {
          id: generateSlotId(),
          label: '上午',
          spots: [
            {
              id: generateSpotId(),
              name: '青城山',
              description: '道教名山，分为前山和后山。前山以道教宫观为主，后山以自然风光著称。建议游览前山。',
              duration: '4小时',
              transport: { mode: '地铁', duration: '1.5小时' },
              tags: ['自然', '文化'],
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '下午',
          spots: [
            {
              id: generateSpotId(),
              name: '都江堰',
              description: '世界文化遗产，古代水利工程奇迹，感受李冰父子的智慧，景色壮观。',
              duration: '3小时',
              transport: { mode: '公交', duration: '30分钟' },
              tags: ['历史', '自然'],
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '晚上',
          spots: [
            {
              id: generateSpotId(),
              name: '南桥夜景',
              description: '都江堰南桥夜晚灯光璀璨，岷江水流湍急，夜景非常壮观，适合拍照。',
              duration: '1小时',
              transport: { mode: '步行', duration: '10分钟' },
              tags: ['夜景'],
            },
          ],
        },
      ],
      tips: ['青城山和都江堰在同一个方向，可以安排同一天', '建议穿舒适的登山鞋'],
    },
    {
      dayNumber: 5,
      title: '悠闲收尾',
      date: '第 5 天',
      slots: [
        {
          id: generateSlotId(),
          label: '上午',
          spots: [
            {
              id: generateSpotId(),
              name: '东郊记忆',
              description: '由旧工厂改造的文化创意园区，充满工业风和文艺气息，适合拍照打卡。',
              duration: '2小时',
              transport: { mode: '地铁', duration: '30分钟' },
              tags: ['文艺', '拍照'],
            },
            {
              id: generateSpotId(),
              name: '望平街',
              description: '成都新晋网红街区，沿河咖啡馆和创意小店林立，适合悠闲漫步。',
              duration: '1.5小时',
              transport: { mode: '打车', duration: '10分钟' },
              tags: ['休闲', '美食'],
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '下午',
          spots: [
            {
              id: generateSpotId(),
              name: '返程准备',
              description: '整理行李，前往机场/火车站，结束愉快的成都之旅。可购买一些特产带回家。',
              duration: '3小时',
              transport: { mode: '地铁', duration: '40分钟' },
              tags: ['其他'],
            },
          ],
        },
      ],
      tips: ['建议提前 2 小时到达机场/车站', '可以买一些火锅底料、兔头等成都特产'],
    },
  ],
  practicalInfo: {
    transport: '成都地铁网络发达，覆盖主要景点。推荐下载"成都地铁"APP扫码乘车。市内打车起步价约 8 元，网约车方便。',
    accommodation: '建议住在春熙路/太古里附近（市中心，交通便利）或宽窄巷子附近（文化氛围浓厚）。民宿均价 200-400 元/晚，酒店 300-600 元/晚。',
    budget: {
      transport: 1200,
      hotel: 1500,
      food: 800,
      tickets: 500,
      other: 400,
    },
  },
  notices: [
    '成都气候湿润，建议携带雨具',
    '部分景点需提前预约（大熊猫基地、博物馆等）',
    '成都美食以辣为主，不习惯辣的可准备肠胃药',
    '市内景点间地铁出行最为方便',
    '建议购买旅游意外险',
  ],
  createdAt: '2026-06-11',
};

/* ========================================
   Mock 攻略 2 — 3天2夜大理自由行
   ======================================== */

const mockItinerary2: ItineraryData = {
  id: 'iti_002',
  title: '3天2夜 大理自由行攻略',
  days: [
    {
      dayNumber: 1,
      title: '洱海西线游',
      date: '第 1 天',
      slots: [
        {
          id: generateSlotId(),
          label: '上午',
          spots: [
            {
              id: generateSpotId(),
              name: '大理古城',
              description: '漫步古城，感受南诏国文化，游览五华楼、洋人街，品尝烤乳扇。',
              duration: '2小时',
              transport: { mode: '步行', duration: '10分钟' },
              tags: ['文化', '美食'],
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '下午',
          spots: [
            {
              id: generateSpotId(),
              name: '才村码头',
              description: '洱海西线经典骑行路线起点，沿途欣赏苍山洱海美景。',
              duration: '2小时',
              transport: { mode: '共享单车', duration: '15分钟' },
              tags: ['自然'],
            },
            {
              id: generateSpotId(),
              name: '喜洲古镇',
              description: '白族民居建筑群，品尝喜洲粑粑，参观严家大院。',
              duration: '2小时',
              transport: { mode: '打车', duration: '10分钟' },
              tags: ['文化', '美食'],
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '晚上',
          spots: [
            {
              id: generateSpotId(),
              name: '大理古城人民路',
              description: '夜晚的人民路热闹非凡，各种小店和酒吧，感受大理的文艺氛围。',
              duration: '2小时',
              transport: { mode: '打车', duration: '20分钟' },
              tags: ['夜景', '休闲'],
            },
          ],
        },
      ],
      tips: ['大理紫外线强，注意防晒', '骑行洱海建议租电动车更轻松'],
    },
    {
      dayNumber: 2,
      title: '洱海东线游',
      date: '第 2 天',
      slots: [
        {
          id: generateSlotId(),
          label: '上午',
          spots: [
            {
              id: generateSpotId(),
              name: '双廊古镇',
              description: '洱海东线最著名的古镇，杨丽萍的太阳宫所在地，海景绝佳。',
              duration: '3小时',
              transport: { mode: '打车', duration: '40分钟' },
              tags: ['自然', '文艺'],
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '下午',
          spots: [
            {
              id: generateSpotId(),
              name: '小普陀',
              description: '洱海中的小岛，冬天有海鸥，是拍照打卡的绝佳地点。',
              duration: '1小时',
              transport: { mode: '打车', duration: '20分钟' },
              tags: ['自然', '拍照'],
            },
            {
              id: generateSpotId(),
              name: '理想邦',
              description: '大理版圣托里尼，白色建筑群，ins 风拍照圣地。',
              duration: '2小时',
              transport: { mode: '打车', duration: '15分钟' },
              tags: ['拍照', '文艺'],
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '晚上',
          spots: [
            {
              id: generateSpotId(),
              name: '大理古城酒吧',
              description: '在大理古城的酒吧听民谣，享受慢节奏的夜晚。',
              duration: '2小时',
              transport: { mode: '打车', duration: '30分钟' },
              tags: ['休闲'],
            },
          ],
        },
      ],
      tips: ['双廊到小普陀沿途风景很美，可以随时停车拍照'],
    },
    {
      dayNumber: 3,
      title: '苍山与返程',
      date: '第 3 天',
      slots: [
        {
          id: generateSlotId(),
          label: '上午',
          spots: [
            {
              id: generateSpotId(),
              name: '苍山',
              description: '乘坐索道上苍山，俯瞰洱海全景，游览七龙女池、洗马潭。',
              duration: '4小时',
              transport: { mode: '打车', duration: '20分钟' },
              tags: ['自然'],
            },
          ],
        },
        {
          id: generateSlotId(),
          label: '下午',
          spots: [
            {
              id: generateSpotId(),
              name: '返程准备',
              description: '整理行李，购买伴手礼（鲜花饼、雕梅等），前往机场/车站。',
              duration: '3小时',
              transport: { mode: '打车', duration: '30分钟' },
              tags: ['其他'],
            },
          ],
        },
      ],
      tips: ['苍山索道有三条，推荐洗马潭索道（最长）', '建议提前 2 小时到达机场'],
    },
  ],
  practicalInfo: {
    transport: '大理古城内步行即可，环洱海建议租车或包车（约 300 元/天）。大理机场到古城约 40 分钟车程。',
    accommodation: '推荐住在大理古城内（热闹方便）或洱海边（安静风景好）。民宿均价 150-300 元/晚。',
    budget: {
      transport: 800,
      hotel: 600,
      food: 500,
      tickets: 400,
      other: 300,
    },
  },
  notices: [
    '大理海拔约 2000 米，注意防晒',
    '洱海骑行注意安全，租车建议购买保险',
    '古城内石板路，建议穿舒适的鞋子',
    '雨季（6-8月）记得携带雨具',
  ],
  createdAt: '2026-06-11',
};

/* ========================================
   Context
   ======================================== */

interface ItineraryState {
  current: ItineraryData | null;
  list: ItineraryData[];
  loading: boolean;
}

type ItineraryAction =
  | { type: 'SET_ITINERARY'; payload: ItineraryData }
  | { type: 'SWITCH_ITINERARY'; payload: string }
  | { type: 'DELETE_ITINERARY'; payload: string }
  | { type: 'ADD_TO_LIST'; payload: ItineraryData }
  | { type: 'SET_LIST'; payload: ItineraryData[] }
  | { type: 'SET_LOADING'; payload: boolean }
  // 编辑操作
  | { type: 'UPDATE_SPOT'; payload: { dayIndex: number; slotIndex: number; spotIndex: number; spot: Spot } }
  | { type: 'DELETE_SPOT'; payload: { dayIndex: number; slotIndex: number; spotIndex: number } }
  | { type: 'ADD_SPOT'; payload: { dayIndex: number; slotIndex: number; spot: Spot; insertAfter?: number } }
  | { type: 'ADD_SLOT'; payload: { dayIndex: number; slot: TimeSlot } }
  | { type: 'ADD_DAY'; payload: { day: Day } }
  | { type: 'REORDER_SPOTS'; payload: { dayIndex: number; slotIndex: number; fromIndex: number; toIndex: number } }
  | { type: 'UPDATE_SPOT_FIELD'; payload: { dayIndex: number; slotIndex: number; spotIndex: number; field: string; value: string } }
  | { type: 'UPDATE_PRACTICAL_INFO'; payload: { field: string; value: string; userNote?: boolean } };

const initialState: ItineraryState = {
  current: null,
  list: [],
  loading: false,
};

function itineraryReducer(
  state: ItineraryState,
  action: ItineraryAction
): ItineraryState {
  switch (action.type) {
    case 'SET_ITINERARY':
      return { ...state, current: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SWITCH_ITINERARY': {
      const found = state.list.find((i) => i.id === action.payload);
      if (!found) return state;
      // 仅当找到的项有完整数据（含 days）时才切换，否则保持当前状态
      if (!(found as any).days && !(found as any).slots) return state;
      return { ...state, current: found };
    }
    case 'DELETE_ITINERARY': {
      const newList = state.list.filter((i) => i.id !== action.payload);
      // 如果删除的是当前攻略，切换到列表第一个
      const newCurrent = state.current?.id === action.payload
        ? (newList[0] ?? null)
        : state.current;
      return { ...state, list: newList, current: newCurrent };
    }
    case 'ADD_TO_LIST': {
      const exists = state.list.some(i => i.id === action.payload.id);
      if (exists) {
        return { ...state, list: state.list.map(i => i.id === action.payload.id ? action.payload : i) };
      }
      return { ...state, list: [...state.list, action.payload] };
    }
    case 'SET_LIST':
      return { ...state, list: action.payload };
    case 'UPDATE_SPOT': {
      if (!state.current) return state;
      const { dayIndex, slotIndex, spotIndex, spot } = action.payload;
      const newDays = [...state.current.days];
      const newSlots = [...newDays[dayIndex].slots];
      const newSpots = [...newSlots[slotIndex].spots];
      newSpots[spotIndex] = spot;
      newSlots[slotIndex] = { ...newSlots[slotIndex], spots: newSpots };
      newDays[dayIndex] = { ...newDays[dayIndex], slots: newSlots };
      return { ...state, current: { ...state.current, days: newDays } };
    }
    case 'DELETE_SPOT': {
      if (!state.current) return state;
      const { dayIndex: ddi, slotIndex: dsi, spotIndex: dspi } = action.payload;
      const delDays = [...state.current.days];
      const delSlots = [...delDays[ddi].slots];
      const delSpots = [...delSlots[dsi].spots];
      delSpots.splice(dspi, 1);
      delSlots[dsi] = { ...delSlots[dsi], spots: delSpots };
      delDays[ddi] = { ...delDays[ddi], slots: delSlots };
      return { ...state, current: { ...state.current, days: delDays } };
    }
    case 'ADD_SPOT': {
      if (!state.current) return state;
      const { dayIndex: adi, slotIndex: asi, spot, insertAfter } = action.payload;
      const addDays = [...state.current.days];
      const addSlots = [...addDays[adi].slots];
      const addSpots = [...addSlots[asi].spots];
      const insertIndex = insertAfter !== undefined ? insertAfter + 1 : addSpots.length;
      addSpots.splice(insertIndex, 0, spot);
      addSlots[asi] = { ...addSlots[asi], spots: addSpots };
      addDays[adi] = { ...addDays[adi], slots: addSlots };
      return { ...state, current: { ...state.current, days: addDays } };
    }
    case 'ADD_SLOT': {
      if (!state.current) return state;
      const { dayIndex: sdi, slot } = action.payload;
      const sDays = [...state.current.days];
      const sSlots = [...sDays[sdi].slots];
      sSlots.push(slot);
      sDays[sdi] = { ...sDays[sdi], slots: sSlots };
      return { ...state, current: { ...state.current, days: sDays } };
    }
    case 'ADD_DAY': {
      if (!state.current) return state;
      return {
        ...state,
        current: {
          ...state.current,
          days: [...state.current.days, action.payload.day],
        },
      };
    }
    case 'REORDER_SPOTS': {
      if (!state.current) return state;
      const { dayIndex: rdi, slotIndex: rsi, fromIndex, toIndex } = action.payload;
      const rDays = [...state.current.days];
      const rSlots = [...rDays[rdi].slots];
      const rSpots = [...rSlots[rsi].spots];
      const [moved] = rSpots.splice(fromIndex, 1);
      rSpots.splice(toIndex, 0, moved);
      rSlots[rsi] = { ...rSlots[rsi], spots: rSpots };
      rDays[rdi] = { ...rDays[rdi], slots: rSlots };
      return { ...state, current: { ...state.current, days: rDays } };
    }
    case 'UPDATE_SPOT_FIELD': {
      if (!state.current) return state;
      const { dayIndex: fdi, slotIndex: fsi, spotIndex: fspi, field, value } = action.payload;
      const fDays = [...state.current.days];
      const fSlots = [...fDays[fdi].slots];
      const fSpots = [...fSlots[fsi].spots];
      fSpots[fspi] = { ...fSpots[fspi], [field]: value };
      fSlots[fsi] = { ...fSlots[fsi], spots: fSpots };
      fDays[fdi] = { ...fDays[fdi], slots: fSlots };
      return { ...state, current: { ...state.current, days: fDays } };
    }
    case 'UPDATE_PRACTICAL_INFO': {
      if (!state.current) return state;
      const { field, value, userNote } = action.payload;
      if (userNote) {
        return {
          ...state,
          current: {
            ...state.current,
            practicalInfo: {
              ...state.current.practicalInfo,
              userNotes: {
                ...state.current.practicalInfo.userNotes,
                [field]: value,
              },
            },
          },
        };
      }
      return {
        ...state,
        current: {
          ...state.current,
          practicalInfo: {
            ...state.current.practicalInfo,
            [field]: value,
          },
        },
      };
    }
    default:
      return state;
  }
}

interface ItineraryContextValue {
  state: ItineraryState;
  dispatch: React.Dispatch<ItineraryAction>;
}

const ItineraryContext = createContext<ItineraryContextValue | null>(null);

export function ItineraryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(itineraryReducer, initialState);

  return (
    <ItineraryContext.Provider value={{ state, dispatch }}>
      {children}
    </ItineraryContext.Provider>
  );
}

export function useItinerary() {
  const ctx = useContext(ItineraryContext);
  if (!ctx) {
    throw new Error('useItinerary must be used within ItineraryProvider');
  }
  return ctx;
}