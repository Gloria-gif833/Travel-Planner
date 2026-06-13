import { useCallback, useRef } from 'react';
import { useItinerary } from '../context/ItineraryContext';
import { generateSpotId, generateSlotId, generateDayNumber } from '../context/ItineraryContext';
import type { Spot, TimeSlot, Day } from '../types/itinerary';
import { TRANSPORT_MODES } from '../types/itinerary';

/* ========================================
   useItineraryEditor Hook — 编辑逻辑
   ======================================== */

export function useItineraryEditor() {
  const { state, dispatch } = useItinerary();
  const undoStack = useRef<string[]>([]);

  /**
   * 查找景点所在索引
   */
  const findSpotIndex = useCallback(
    (spotId: string) => {
      if (!state.current) return null;
      for (let di = 0; di < state.current.days.length; di++) {
        for (let si = 0; si < state.current.days[di].slots.length; si++) {
          for (let spi = 0; spi < state.current.days[di].slots[si].spots.length; spi++) {
            if (state.current.days[di].slots[si].spots[spi].id === spotId) {
              return { dayIndex: di, slotIndex: si, spotIndex: spi };
            }
          }
        }
      }
      return null;
    },
    [state.current]
  );

  /**
   * 更新景点
   */
  const updateSpot = useCallback(
    (spotId: string, updatedSpot: Spot) => {
      const idx = findSpotIndex(spotId);
      if (idx) {
        dispatch({ type: 'UPDATE_SPOT', payload: { ...idx, spot: updatedSpot } });
      }
    },
    [dispatch, findSpotIndex]
  );

  /**
   * 删除景点
   */
  const deleteSpot = useCallback(
    (spotId: string) => {
      const idx = findSpotIndex(spotId);
      if (idx) {
        dispatch({ type: 'DELETE_SPOT', payload: idx });
      }
    },
    [dispatch, findSpotIndex]
  );

  /**
   * 添加景点（到指定时段末尾）
   */
  const addSpot = useCallback(
    (dayIndex: number, slotIndex: number, spot?: Partial<Spot>) => {
      const newSpot: Spot = {
        id: generateSpotId(),
        name: spot?.name ?? '新景点',
        description: spot?.description ?? '点击编辑景点描述',
        duration: spot?.duration ?? '1小时',
        transport: spot?.transport,
        tags: spot?.tags ?? [],
      };
      dispatch({ type: 'ADD_SPOT', payload: { dayIndex, slotIndex, spot: newSpot } });
    },
    [dispatch]
  );

  /**
   * 在某个景点后面插入新景点
   */
  const addSpotAfter = useCallback(
    (afterSpotId: string, spot?: Partial<Spot>) => {
      const idx = findSpotIndex(afterSpotId);
      if (idx) {
        const newSpot: Spot = {
          id: generateSpotId(),
          name: spot?.name ?? '新景点',
          description: spot?.description ?? '点击编辑景点描述',
          duration: spot?.duration ?? '1小时',
          transport: spot?.transport,
          tags: spot?.tags ?? [],
        };
        dispatch({
          type: 'ADD_SPOT',
          payload: { ...idx, spot: newSpot, insertAfter: idx.spotIndex },
        });
      }
    },
    [dispatch, findSpotIndex]
  );

  /**
   * 添加时段
   */
  const addSlot = useCallback(
    (dayIndex: number, label?: string) => {
      const labels = ['上午', '下午', '晚上'];
      const day = state.current?.days[dayIndex];
      // 根据已有时段推断下一个时段
      const existingLabels = day?.slots.map((s) => s.label) ?? [];
      const nextLabel = labels.find((l) => !existingLabels.includes(l)) ?? '晚上';

      const newSlot: TimeSlot = {
        id: generateSlotId(),
        label: label ?? nextLabel,
        spots: [],
      };
      dispatch({ type: 'ADD_SLOT', payload: { dayIndex, slot: newSlot } });
    },
    [dispatch, state.current]
  );

  /**
   * 添加天数
   */
  const addDay = useCallback(
    (title?: string) => {
      const dayCount = state.current?.days.length ?? 0;
      const newDay: Day = {
        dayNumber: generateDayNumber(),
        title: title ?? `第 ${dayCount + 1} 天`,
        date: `第 ${dayCount + 1} 天`,
        slots: [
          {
            id: generateSlotId(),
            label: '上午',
            spots: [],
          },
          {
            id: generateSlotId(),
            label: '下午',
            spots: [],
          },
          {
            id: generateSlotId(),
            label: '晚上',
            spots: [],
          },
        ],
      };
      dispatch({ type: 'ADD_DAY', payload: { day: newDay } });
    },
    [dispatch, state.current]
  );

  /**
   * 拖拽排序
   */
  const reorderSpots = useCallback(
    (dayIndex: number, slotIndex: number, fromIndex: number, toIndex: number) => {
      dispatch({
        type: 'REORDER_SPOTS',
        payload: { dayIndex, slotIndex, fromIndex, toIndex },
      });
    },
    [dispatch]
  );

  /**
   * 原地编辑字段更新
   */
  const updateSpotField = useCallback(
    (
      spotId: string,
      field: string,
      value: string
    ) => {
      const idx = findSpotIndex(spotId);
      if (idx) {
        dispatch({
          type: 'UPDATE_SPOT_FIELD',
          payload: { ...idx, field, value },
        });
      }
    },
    [dispatch, findSpotIndex]
  );

  /**
   * 获取当前攻略数据（供弹窗/外部使用）
   */
  const getSpotById = useCallback(
    (spotId: string): Spot | null => {
      if (!state.current) return null;
      for (const day of state.current.days) {
        for (const slot of day.slots) {
          for (const spot of slot.spots) {
            if (spot.id === spotId) return spot;
          }
        }
      }
      return null;
    },
    [state.current]
  );

  return {
    updateSpot,
    deleteSpot,
    addSpot,
    addSpotAfter,
    addSlot,
    addDay,
    reorderSpots,
    updateSpotField,
    getSpotById,
    findSpotIndex,
    transportModes: TRANSPORT_MODES,
  };
}