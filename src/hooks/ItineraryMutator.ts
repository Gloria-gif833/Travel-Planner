/* ========================================
   ItineraryMutator — 攻略数据操作执行器
   根据意图提取的结构化指令，执行确定性的数据操作
   ======================================== */

import type { ItineraryData, Day, Spot } from '../types/itinerary';
import type { IntentResult } from '../types/intent';

export interface MutationResult {
  itinerary: ItineraryData;
  success: boolean;
  message: string;
}

export class ItineraryMutator {
  /**
   * 通用入口：根据指令类型路由到具体操作方法
   */
  static apply(instruction: IntentResult, itinerary: ItineraryData): MutationResult {
    try {
      switch (instruction.intent) {
        case 'swap_days':
          return ItineraryMutator.swapDays(itinerary, instruction.params);
        case 'move_spot':
          return ItineraryMutator.moveSpot(itinerary, instruction.params);
        case 'delete_spot':
          return ItineraryMutator.deleteSpot(itinerary, instruction.params);
        case 'delete_day':
          return ItineraryMutator.deleteDay(itinerary, instruction.params);
        case 'modify_spot':
          return ItineraryMutator.modifySpot(itinerary, instruction.params);
        default:
          return { itinerary, success: false, message: '无法识别的指令类型' };
      }
    } catch (e) {
      return { itinerary, success: false, message: `执行出错: ${(e as Error).message}` };
    }
  }

  /**
   * 交换两天的全部行程
   */
  static swapDays(itinerary: ItineraryData, params: Record<string, any>): MutationResult {
    const { dayA, dayB } = params;
    if (dayA === undefined || dayB === undefined) {
      return { itinerary, success: false, message: '缺少天数索引' };
    }
    if (dayA < 0 || dayA >= itinerary.days.length || dayB < 0 || dayB >= itinerary.days.length) {
      return { itinerary, success: false, message: '天数索引超出范围' };
    }

    const newDays = [...itinerary.days];
    // 交换完整 day 数据
    [newDays[dayA], newDays[dayB]] = [newDays[dayB], newDays[dayA]];
    // 修复 dayNumber
    newDays[dayA] = { ...newDays[dayA], dayNumber: dayA + 1 };
    newDays[dayB] = { ...newDays[dayB], dayNumber: dayB + 1 };

    return {
      itinerary: { ...itinerary, days: newDays },
      success: true,
      message: `已交换第 ${dayA + 1} 天和第 ${dayB + 1} 天的行程`,
    };
  }

  /**
   * 移动景点到另一天/时段
   */
  static moveSpot(itinerary: ItineraryData, params: Record<string, any>): MutationResult {
    const { spotName, targetDay, targetSlot = 1 } = params;
    if (!spotName || targetDay === undefined) {
      return { itinerary, success: false, message: '缺少景点名称或目标天' };
    }

    // 查找景点（遍历所有天和时段）
    let foundSpot: Spot | null = null;
    let foundDay = -1;
    let foundSlot = -1;
    let foundIdx = -1;

    for (let di = 0; di < itinerary.days.length; di++) {
      const day = itinerary.days[di];
      for (let si = 0; si < day.slots.length; si++) {
        const slot = day.slots[si];
        const idx = slot.spots.findIndex(
          s => s.name.includes(spotName) || spotName.includes(s.name)
        );
        if (idx >= 0) {
          foundSpot = slot.spots[idx];
          foundDay = di;
          foundSlot = si;
          foundIdx = idx;
          break;
        }
      }
      if (foundSpot) break;
    }

    if (!foundSpot) {
      return { itinerary, success: false, message: `未找到景点「${spotName}」` };
    }

    if (targetDay < 0 || targetDay >= itinerary.days.length) {
      return { itinerary, success: false, message: '目标天索引超出范围' };
    }

    if (targetSlot < 0 || targetSlot >= itinerary.days[targetDay].slots.length) {
      return { itinerary, success: false, message: '目标时段索引超出范围' };
    }

    // 深拷贝
    const newDays = itinerary.days.map(day => ({
      ...day,
      slots: day.slots.map(slot => ({
        ...slot,
        spots: [...slot.spots],
      })),
    }));

    // 从原位置移除
    const [movedSpot] = newDays[foundDay].slots[foundSlot].spots.splice(foundIdx, 1);
    // 插入目标位置
    newDays[targetDay].slots[targetSlot].spots.push(movedSpot);

    return {
      itinerary: { ...itinerary, days: newDays },
      success: true,
      message: `已将「${spotName}」从第 ${foundDay + 1} 天移至第 ${targetDay + 1} 天`,
    };
  }

  /**
   * 删除指定景点
   */
  static deleteSpot(itinerary: ItineraryData, params: Record<string, any>): MutationResult {
    const { spotName } = params;
    if (!spotName) {
      return { itinerary, success: false, message: '缺少景点名称' };
    }

    const newDays = itinerary.days.map(day => ({
      ...day,
      slots: day.slots.map(slot => ({
        ...slot,
        spots: slot.spots.filter(
          s => !(s.name.includes(spotName) || spotName.includes(s.name))
        ),
      })),
    }));

    return {
      itinerary: { ...itinerary, days: newDays },
      success: true,
      message: `已删除「${spotName}」`,
    };
  }

  /**
   * 删除某天
   */
  static deleteDay(itinerary: ItineraryData, params: Record<string, any>): MutationResult {
    const { dayA } = params;
    if (dayA === undefined) {
      return { itinerary, success: false, message: '缺少天数索引' };
    }
    if (dayA < 0 || dayA >= itinerary.days.length) {
      return { itinerary, success: false, message: '天数索引超出范围' };
    }

    const newDays = [...itinerary.days];
    newDays.splice(dayA, 1);
    // 重新编号
    const renumbered = newDays.map((day, idx) => ({
      ...day,
      dayNumber: idx + 1,
    }));

    return {
      itinerary: { ...itinerary, days: renumbered },
      success: true,
      message: `已删除第 ${dayA + 1} 天`,
    };
  }

  /**
   * 修改景点属性
   */
  static modifySpot(itinerary: ItineraryData, params: Record<string, any>): MutationResult {
    const { spotName, field, value } = params;
    if (!spotName || !field || value === undefined) {
      return { itinerary, success: false, message: '缺少景点名称、字段或值' };
    }

    const newDays = itinerary.days.map(day => ({
      ...day,
      slots: day.slots.map(slot => ({
        ...slot,
        spots: slot.spots.map(spot => {
          if (spot.name.includes(spotName) || spotName.includes(spot.name)) {
            return { ...spot, [field]: value };
          }
          return spot;
        }),
      })),
    }));

    return {
      itinerary: { ...itinerary, days: newDays },
      success: true,
      message: `已将「${spotName}」的${field}修改为「${value}」`,
    };
  }
}