/* ========================================
   高德地图 API 服务 — 交通时长查询
   ======================================== */

import { logger } from '../utils/logger';

const AMAP_BASE = 'https://restapi.amap.com/v3';
const KEY = process.env.AMAP_API_KEY || '';

/** 地理编码响应 */
interface GeocodeResult {
  location: string;  // "经度,纬度"
  level: string;
}

/** 路径规划结果 */
export interface TravelTimeInfo {
  /** 可读时长，如 "约10小时30分钟" */
  durationText: string;
  /** 分钟数 */
  durationMinutes: number;
  /** 可读距离 */
  distanceText: string;
  /** 推荐交通方式 */
  recommendMode: string;
}

/**
 * 地理编码：城市名 → 经纬度
 */
async function geocodeAddress(address: string, city?: string): Promise<GeocodeResult | null> {
  if (!KEY) {
    logger.warn('高德 API Key 未配置');
    return null;
  }

  const params = new URLSearchParams({
    key: KEY,
    address,
    city: city || address,
  });

  try {
    const res = await fetch(`${AMAP_BASE}/geocode/geo?${params}`);
    const data: any = await res.json();

    if (data.status !== '1' || !data.geocodes?.length) {
      logger.warn(`地理编码失败: ${address} — ${data.info}`);
      return null;
    }

    return data.geocodes[0];
  } catch (err) {
    logger.error(`地理编码请求失败: ${(err as Error).message}`);
    return null;
  }
}

/**
 * 查询城际公共交通时长（高铁/火车/长途巴士）
 * 使用高德公交跨城 API
 */
export async function getIntercityTransit(
  fromCity: string,
  toCity: string
): Promise<TravelTimeInfo | null> {
  if (!KEY) return null;

  // 1. 地理编码两个城市
  const [fromGeo, toGeo] = await Promise.all([
    geocodeAddress(fromCity),
    geocodeAddress(toCity),
  ]);

  if (!fromGeo || !toGeo) return null;

  // 2. 公交路径规划（综合交通）
  const params = new URLSearchParams({
    key: KEY,
    origin: fromGeo.location,
    destination: toGeo.location,
    city: fromCity,
    cityd: toCity,
    alternative: '0',
    strategy: '0', // 最快捷
  });

  // 使用 AbortController（ES2020 兼容）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${AMAP_BASE}/direction/transit/integrated?${params}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data: any = await res.json();

    if (data.status !== '1') {
      logger.warn(`路径规划失败: ${fromCity}→${toCity} — ${data.info}`);
      return null;
    }

    // 解析第一条路线
    const route = data.route?.transits?.[0];
    if (!route) return null;

    // 计算总时长（秒 → 分钟）
    const totalSeconds = parseInt(route.duration || '0', 10);
    const totalMinutes = Math.round(totalSeconds / 60);

    // 距离（米 → 公里）
    const distanceMeters = parseInt(route.distance || '0', 10);
    const distanceKm = Math.round(distanceMeters / 1000);

    // 判断主要交通方式
    let mainMode = '公共交通';
    const segments = route.segments || [];
    for (const seg of segments) {
      const mode = seg.transit_mode || '';
      if (mode.includes('RAIL')) { mainMode = '高铁'; break; }
      if (mode.includes('AIR')) { mainMode = '飞机'; break; }
      if (mode.includes('BUS')) { mainMode = '长途大巴'; break; }
      if (mode.includes('SUBWAY')) { mainMode = '地铁'; break; }
    }

    return {
      durationText: formatDuration(totalMinutes),
      durationMinutes: totalMinutes,
      distanceText: distanceKm > 0 ? `约${distanceKm}公里` : '',
      recommendMode: mainMode,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    logger.error(`路径规划请求失败: ${(err as Error).message}`);
    return null;
  }
}

/**
 * 查询市内驾车时长（景点间通勤参考）
 */
export async function getDrivingTime(
  fromCity: string,
  fromAddress: string,
  toAddress: string
): Promise<TravelTimeInfo | null> {
  if (!KEY) return null;

  // 地理编码两个地址
  const [fromGeo, toGeo] = await Promise.all([
    geocodeAddress(fromAddress, fromCity),
    geocodeAddress(toAddress, fromCity),
  ]);

  if (!fromGeo || !toGeo) return null;

  const params = new URLSearchParams({
    key: KEY,
    origin: fromGeo.location,
    destination: toGeo.location,
    city: fromCity,
    strategy: '0',
  });

  try {
    const res = await fetch(`${AMAP_BASE}/direction/driving?${params}`, {
      signal: AbortSignal.timeout(10000),
    });
    const data: any = await res.json();

    if (data.status !== '1' || !data.route?.paths?.length) {
      return null;
    }

    const path = data.route.paths[0];
    const minutes = Math.round(parseInt(path.duration || '0', 10) / 60);
    const meters = parseInt(path.distance || '0', 10);

    return {
      durationText: formatDuration(minutes),
      durationMinutes: minutes,
      distanceText: meters > 0 ? `约${Math.round(meters / 1000)}公里` : '',
      recommendMode: '驾车',
    };
  } catch (err) {
    logger.error(`驾车路径查询失败: ${(err as Error).message}`);
    return null;
  }
}

/**
 * 构建交通信息文本 → 注入 Prompt
 */
export function buildTransitInfoText(
  departure: string,
  destination: string,
  transit: TravelTimeInfo | null
): string {
  if (!transit) {
    return `【交通参考】${departure} → ${destination}：未获取到实时交通数据，请根据常识估算。`;
  }

  return [
    `【交通参考】${departure} → ${destination}：`,
    `- 推荐方式：${transit.recommendMode}`,
    `- 通行时长：${transit.durationText}`,
    transit.distanceText ? `- 通行距离：${transit.distanceText}` : '',
    `- 请在行程中将城际交通作为独立的景点呈现，并在 description 中给出出行建议`,
  ].filter(Boolean).join('\n');
}

/**
 * 分钟 → 可读中文
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `约${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `约${h}小时`;
  return `约${h}小时${m}分钟`;
}