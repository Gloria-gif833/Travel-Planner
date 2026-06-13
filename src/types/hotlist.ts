/* ========================================
   热榜数据类型
   ======================================== */

export interface HotItem {
  id: number;
  rank: number;
  title: string;
  sources: string;       // 热度来源描述
  summary: string;
  isHot: boolean;
  tags?: string[];       // 可选，如 "热度飙升"
}