import { logger } from '../utils/logger';

/* ========================================
   攻略解析器 — AI 返回转结构化攻略数据
   Each spot gets a unique id for frontend editing.
   ======================================== */

interface ParsedSpot {
  id: string;
  name: string;
  description: string;
  duration: string;
  transport?: { mode: string; duration: string };
  tags?: string[];
  isTransit?: boolean;
  recommendReason?: string;
  ticketInfo?: { type: string; price?: string };
}

interface ParsedSlot {
  label: string;
  spots: ParsedSpot[];
}

interface ParsedDay {
  dayNumber: number;
  title: string;
  date?: string;
  slots: ParsedSlot[];
  tips?: string[];
}

interface ParsedItinerary {
  title: string;
  days: ParsedDay[];
  practicalInfo: {
    transport: string;
    accommodation: string;
    budget: Record<string, number>;
  };
  notices: string[];
}

const VALID_TRANSPORT_MODES = ['地铁', '步行', '公交', '打车', '共享单车', '高铁', '火车', '飞机', '自驾', '长途大巴', '动车'];
const VALID_TAGS = ['景点', '美食', '文化', '自然', '历史', '购物', '休闲', '夜景', '拍照', '亲子', '文艺', '其他', '交通'];
const VALID_SLOT_LABELS = ['上午', '下午', '晚上'];

/**
 * 清理 AI 返回内容，提取纯 JSON
 */
function extractJson(raw: string): string {
  // 尝试提取 ```json ... ``` 块
  const jsonBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }
  // 尝试提取最外层 { ... }
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    return braceMatch[0];
  }
  return raw.trim();
}

/**
 * 解析并校验 AI 返回的攻略 JSON
 */
export function parseItinerary(raw: string): ParsedItinerary {
  const jsonStr = extractJson(raw);

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    logger.error(`攻略 JSON 解析失败: ${(err as Error).message}`);
    // 返回一个默认攻略结构以便前端不崩溃
    return getDefaultItinerary();
  }

  // 校验基本结构
  const title = parsed.title || '未命名攻略';
  const days = Array.isArray(parsed.days) ? parsed.days : [];
  const practicalInfo = parsed.practicalInfo || {};
  const notices = Array.isArray(parsed.notices) ? parsed.notices : [];

  const validatedDays: ParsedDay[] = days.map((day: any, di: number) => {
    const slots = Array.isArray(day.slots) ? day.slots : [];

    const validatedSlots: ParsedSlot[] = slots.map((slot: any, si: number) => {
      const label = VALID_SLOT_LABELS.includes(slot.label) ? slot.label : '上午';
      const spots = Array.isArray(slot.spots) ? slot.spots : [];

      const validatedSpots: ParsedSpot[] = spots.map((spot: any, spi: number) => ({
        name: spot.name || '未命名景点',
        description: spot.description || '',
        duration: spot.duration || '1小时',
        transport: spot.transport
          ? {
              mode: VALID_TRANSPORT_MODES.includes(spot.transport.mode)
                ? spot.transport.mode
                : '步行',
              duration: spot.transport.duration || '10分钟',
            }
          : undefined,
        tags: Array.isArray(spot.tags)
          ? spot.tags.filter((t: string) => VALID_TAGS.includes(t))
          : [],
        isTransit: spot.isTransit === true,
        recommendReason: spot.recommendReason || '',
        ticketInfo: spot.ticketInfo
          ? {
              type: spot.ticketInfo.type === '收费' ? '收费' : '免费',
              price: spot.ticketInfo.price || (spot.ticketInfo.type === '收费' ? '价格待查' : ''),
            }
          : undefined,
        // 生成唯一 id 供前端编辑/删除使用
        id: spot.id || `spot_${di}_${si}_${spi}`,
      }));

      return { label, spots: validatedSpots };
    });

    return {
      dayNumber: day.dayNumber || di + 1,
      title: day.title || `第 ${di + 1} 天`,
      date: day.date || `第 ${di + 1} 天`,
      slots: validatedSlots,
      tips: Array.isArray(day.tips) ? day.tips : [],
    };
  });

  return {
    title,
    days: validatedDays.length > 0 ? validatedDays : getDefaultDays(),
    practicalInfo: {
      transport: practicalInfo.transport || '建议使用公共交通出行',
      accommodation: practicalInfo.accommodation || '建议选择市中心住宿',
      budget: practicalInfo.budget || { transport: 0, hotel: 0, food: 0, tickets: 0, other: 0 },
    },
    notices: notices.length > 0 ? notices : ['注意安全，祝旅途愉快！'],
  };
}

function getDefaultDays(): ParsedDay[] {
  const uid = () => 'spot_df_' + Math.random().toString(36).slice(2, 10);
  return [
    {
      dayNumber: 1,
      title: '第一天',
      date: '第 1 天',
      slots: [
        {
          label: '上午',
          spots: [{ id: uid(), name: '景点待定', description: '请补充景点信息', duration: '2小时', tags: [] }],
        },
        {
          label: '下午',
          spots: [{ id: uid(), name: '景点待定', description: '请补充景点信息', duration: '2小时', tags: [] }],
        },
        {
          label: '晚上',
          spots: [{ id: uid(), name: '景点待定', description: '请补充景点信息', duration: '2小时', tags: [] }],
        },
      ],
      tips: [],
    },
  ];
}

function getDefaultItinerary(): ParsedItinerary {
  return {
    title: 'AI 生成攻略',
    days: getDefaultDays(),
    practicalInfo: {
      transport: '建议使用公共交通出行',
      accommodation: '建议选择市中心住宿',
      budget: { transport: 0, hotel: 0, food: 0, tickets: 0, other: 0 },
    },
    notices: ['注意安全，祝旅途愉快！'],
  };
}