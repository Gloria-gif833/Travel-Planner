/* ========================================
   意图提取类型定义
   ======================================== */

export type IntentType =
  | 'swap_days'
  | 'move_spot'
  | 'delete_spot'
  | 'delete_day'
  | 'modify_spot'
  | 'unknown';

export interface IntentParams {
  dayA?: number;       // swap_days: 天A索引
  dayB?: number;       // swap_days: 天B索引
  spotName?: string;   // move_spot/delete_spot/modify_spot: 景点名称
  targetDay?: number;  // move_spot: 目标天索引
  targetSlot?: number; // move_spot: 目标时段索引 (0=上午,1=下午,2=晚上)
  sourceDay?: number;  // 来源天索引
  sourceSlot?: number; // 来源时段索引
  field?: string;      // modify_spot: 要修改的字段名
  value?: string;      // modify_spot: 修改后的值
}

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  params: IntentParams;
  summary: string;
}