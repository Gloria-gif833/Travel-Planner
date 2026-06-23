/* ========================================
   diffItinerary — 攻略差异比较，生成可读摘要
   比较两版攻略数据，自动生成人类可读的变更摘要
   ======================================== */

import type { ItineraryData, Day, Spot } from '../types/itinerary';

export interface DiffResult {
  summary: string;
  changes: string[];
}

/**
 * 比较两版攻略，生成差异摘要
 * @param oldData 旧版攻略（JSON string 或对象）
 * @param newData 新版攻略（JSON string 或对象）
 * @returns 可读的差异摘要和具体变更列表
 */
export function diffItinerary(
  oldData: ItineraryData | string | null,
  newData: ItineraryData | string | null
): DiffResult {
  const changes: string[] = [];

  if (!oldData || !newData) {
    return { summary: '攻略已更新', changes: [] };
  }

  // 解析
  const oldItin = typeof oldData === 'string' ? safeParse(oldData) : oldData;
  const newItin = typeof newData === 'string' ? safeParse(newData) : newData;

  if (!oldItin || !newItin) {
    return { summary: '攻略已更新', changes: [] };
  }

  // 比较天数
  detectDayChanges(oldItin, newItin, changes);

  // 比较景点
  detectSpotChanges(oldItin, newItin, changes);

  // 比较实用信息
  detectInfoChanges(oldItin, newItin, changes);

  // 生成摘要
  const summary = buildSummary(changes);

  return { summary, changes };
}

/**
 * 检测天数变化
 */
function detectDayChanges(oldItin: ItineraryData, newItin: ItineraryData, changes: string[]) {
  const oldDayCount = oldItin.days?.length || 0;
  const newDayCount = newItin.days?.length || 0;

  if (newDayCount > oldDayCount) {
    const added = newDayCount - oldDayCount;
    changes.push(`新增了 ${added} 天行程`);
  } else if (newDayCount < oldDayCount) {
    const removed = oldDayCount - newDayCount;
    changes.push(`删除了 ${removed} 天行程`);
  }

  // 检测天数互换 — 比较每天的主要景点是否交叉出现
  if (oldDayCount >= 2 && newDayCount >= 2 && oldDayCount === newDayCount) {
    for (let i = 0; i < oldDayCount; i++) {
      for (let j = i + 1; j < oldDayCount; j++) {
        const oldDayINames = getDaySpotNames(oldItin.days[i]);
        const oldDayJNames = getDaySpotNames(oldItin.days[j]);
        const newDayINames = getDaySpotNames(newItin.days[i]);
        const newDayJNames = getDaySpotNames(newItin.days[j]);

        // 如果 Day i 的旧景点出现在 Day j 的新景点中，且 Day j 的旧景点出现在 Day i 的新景点中
        const dayIContainsOldJ = newDayINames.some(n => oldDayJNames.includes(n));
        const dayJContainsOldI = newDayJNames.some(n => oldDayINames.includes(n));

        if (dayIContainsOldJ && dayJContainsOldI) {
          changes.push(`交换了第 ${i + 1} 天和第 ${j + 1} 天的行程`);
          return; // 一次只检测到一个互换
        }
      }
    }
  }
}

/**
 * 检测景点变化（增删改、移动）
 */
function detectSpotChanges(oldItin: ItineraryData, newItin: ItineraryData, changes: string[]) {
  const oldSpots = getAllSpotsWithPosition(oldItin);
  const newSpots = getAllSpotsWithPosition(newItin);

  // 找出被删除的景点
  for (const old of oldSpots) {
    const found = newSpots.find(n => n.spot.id === old.spot.id || n.spot.name === old.spot.name);
    if (!found) {
      changes.push(`删除了「${old.spot.name}」（原在第 ${old.dayIndex + 1} 天 ${old.slotLabel}）`);
    } else if (found.dayIndex !== old.dayIndex) {
      // 景点被移动到不同天
      changes.push(`将「${old.spot.name}」从第 ${old.dayIndex + 1} 天移至第 ${found.dayIndex + 1} 天`);
    } else if (found.slotIndex !== old.slotIndex) {
      changes.push(`将「${old.spot.name}」从${old.slotLabel}调至${found.slotLabel}`);
    }
  }

  // 找出新增的景点
  for (const n of newSpots) {
    const found = oldSpots.find(o => o.spot.id === n.spot.id || o.spot.name === n.spot.name);
    if (!found) {
      changes.push(`在第 ${n.dayIndex + 1} 天 ${n.slotLabel}新增了「${n.spot.name}」`);
    } else {
      // 检测字段变更
      detectFieldChanges(oldItin, newItin, found, n, changes);
    }
  }

  // 检测拖拽排序（景点都在但顺序变了）
  if (changes.length === 0 && oldSpots.length === newSpots.length && oldSpots.length > 1) {
    for (let i = 0; i < oldSpots.length; i++) {
      if (oldSpots[i].spot.name !== newSpots[i]?.spot.name) {
        changes.push('调整了景点的顺序');
        break;
      }
    }
  }
}

/**
 * 检测景点字段变更
 */
function detectFieldChanges(
  oldItin: ItineraryData,
  newItin: ItineraryData,
  oldSpot: { spot: Spot; dayIndex: number; slotLabel: string },
  newSpot: { spot: Spot; dayIndex: number; slotLabel: string },
  changes: string[]
) {
  const o = oldSpot.spot;
  const n = newSpot.spot;

  if (o.name !== n.name) {
    changes.push(`将「${o.name}」的名称修改为「${n.name}」`);
  }
  if (o.duration !== n.duration) {
    changes.push(`将「${n.name || o.name}」的游玩时长改为「${n.duration}」`);
  }
  if ((o.description || '') !== (n.description || '') && n.description.length > 0) {
    // 描述变更比较敏感，只在非轻微改动时记录
    const ratio = levenshteinRatio(o.description || '', n.description || '');
    if (ratio > 0.3) {
      changes.push(`修改了「${n.name || o.name}」的描述`);
    }
  }
  if (JSON.stringify(o.transport) !== JSON.stringify(n.transport) && n.transport) {
    changes.push(`修改了「${n.name || o.name}」的交通方式`);
  }
}

/**
 * 检测实用信息变更
 */
function detectInfoChanges(oldItin: ItineraryData, newItin: ItineraryData, changes: string[]) {
  const oldInfo = oldItin.practicalInfo;
  const newInfo = newItin.practicalInfo;
  if (!oldInfo || !newInfo) return;

  // 预算变更
  if (oldInfo.budget && newInfo.budget) {
    const oldTotal = oldInfo.budget.transport + oldInfo.budget.hotel + oldInfo.budget.food + oldInfo.budget.tickets + oldInfo.budget.other;
    const newTotal = newInfo.budget.transport + newInfo.budget.hotel + newInfo.budget.food + newInfo.budget.tickets + newInfo.budget.other;
    if (oldTotal !== newTotal) {
      changes.push(`更新了预算（${oldTotal}元 → ${newTotal}元）`);
    }
  }
}

/**
 * 获取某天的所有景点名称
 */
function getDaySpotNames(day: Day): string[] {
  const names: string[] = [];
  if (day?.slots) {
    for (const slot of day.slots) {
      for (const spot of slot.spots) {
        if (spot.name) names.push(spot.name);
      }
    }
  }
  return names;
}

/**
 * 获取所有景点及其位置
 */
function getAllSpotsWithPosition(itin: ItineraryData) {
  const result: { spot: Spot; dayIndex: number; slotIndex: number; slotLabel: string }[] = [];
  if (!itin.days) return result;
  for (let di = 0; di < itin.days.length; di++) {
    const day = itin.days[di];
    if (!day.slots) continue;
    for (let si = 0; si < day.slots.length; si++) {
      const slot = day.slots[si];
      for (const spot of slot.spots) {
        result.push({ spot, dayIndex: di, slotIndex: si, slotLabel: slot.label });
      }
    }
  }
  return result;
}

/**
 * 从变更列表构建摘要
 */
function buildSummary(changes: string[]): string {
  if (changes.length === 0) return '攻略已更新（无显著变动）';
  if (changes.length === 1) return changes[0];
  // 取最重要的 2 个变化
  const topChanges = changes.slice(0, 2);
  return topChanges.join('；') + (changes.length > 2 ? `（等 ${changes.length} 项变更）` : '');
}

/**
 * 安全解析 JSON
 */
function safeParse(str: string): ItineraryData | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * 计算编辑距离比值（判断文本是否大幅修改）
 */
function levenshteinRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  const distance = levenshteinDistance(a, b);
  return distance / maxLen;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}