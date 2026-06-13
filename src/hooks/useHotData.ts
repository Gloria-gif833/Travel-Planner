import { useState, useEffect } from 'react';
import type { HotItem } from '../types/hotlist';

/* ========================================
   Mock 热榜数据 — Top 10 旅行热点
   后续替换为 HotData API 调用
   ======================================== */

const mockHotData: HotItem[] = [
  {
    id: 1,
    rank: 1,
    title: '成都五一假期旅游订单量同比增长 210%',
    sources: '微博热搜 1 / 抖音 1200w 播放',
    summary: '成都再次成为五一假期最热门旅游目的地，春熙路、宽窄巷子、大熊猫基地搜索量暴涨。',
    isHot: true,
    tags: ['热度飙升'],
  },
  {
    id: 2,
    rank: 2,
    title: '大理洱海生态廊道全线贯通，骑行路线爆火',
    sources: '微博热搜 3 / 抖音 980w 播放',
    summary: '全长 129 公里的洱海生态廊道已全线贯通，沿途骑行成为年轻游客新的打卡方式。',
    isHot: true,
    tags: ['热度飙升'],
  },
  {
    id: 3,
    rank: 3,
    title: '淄博烧烤热度不减，五一期间再迎客流高峰',
    sources: '微博热搜 6 / 抖音 750w 播放',
    summary: '淄博烧烤持续走红，当地政府新增多条公交专线，烧烤城扩建至 200 个摊位。',
    isHot: true,
  },
  {
    id: 4,
    rank: 4,
    title: '杭州西湖景区实行预约制限流，每日 8 万人',
    sources: '微博热搜 10 / 抖音 520w 播放',
    summary: '西湖景区发布五一期间预约限流公告，建议游客错峰出行，提前 3 天预约。',
    isHot: false,
  },
  {
    id: 5,
    rank: 5,
    title: '三亚离岛免税销售额破纪录，人均消费增长 35%',
    sources: '抖音 480w 播放 / 小红书热搜 2',
    summary: '三亚离岛免税新政实施以来，人均免税消费金额同比增长 35%，化妆品和箱包最受欢迎。',
    isHot: false,
    tags: ['消费热点'],
  },
  {
    id: 6,
    rank: 6,
    title: '西安大唐不夜城推出新 IP 互动演出',
    sources: '微博热搜 15 / 小红书热搜 4',
    summary: '大唐不夜城全新升级夜间演出，新增沉浸式互动环节，日均客流突破 10 万人次。',
    isHot: false,
  },
  {
    id: 7,
    rank: 7,
    title: '重庆洪崖洞景区周边交通管制，建议公共交通出行',
    sources: '公众号热搜 1 / 抖音 320w 播放',
    summary: '五一期间洪崖洞周边实行交通管制，景区建议游客乘轨道交通前往，夜游票需提前预约。',
    isHot: false,
  },
  {
    id: 8,
    rank: 8,
    title: '敦煌莫高窟推出淡季优惠政策，门票半价',
    sources: '微博热搜 22 / 抖音 280w 播放',
    summary: '敦煌莫高窟 5 月起执行淡季门票政策，同时新增特窟开放名额，每日限流 6000 人。',
    isHot: false,
  },
  {
    id: 9,
    rank: 9,
    title: '青岛啤酒节宣布 7 月开幕，场地规模扩大 50%',
    sources: '抖音 210w 播放 / 小红书热搜 8',
    summary: '2025 青岛国际啤酒节定于 7 月中旬开幕，主会场面积扩大 50%，预计接待游客超百万人次。',
    isHot: false,
  },
  {
    id: 10,
    rank: 10,
    title: '张家界国家森林公园启用无人机配送服务',
    sources: '微博热搜 28 / 抖音 180w 播放',
    summary: '张家界国家森林公园与美团合作推出无人机配送，游客可在山顶通过手机下单，15 分钟送达。',
    isHot: false,
  },
];

export function useHotData() {
  const [data, setData] = useState<HotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHotData() {
      setLoading(true);
      try {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 600));

        if (!cancelled) {
          setData(mockHotData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError('获取热榜数据失败，请稍后重试');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchHotData();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}