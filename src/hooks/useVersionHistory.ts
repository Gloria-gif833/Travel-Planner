import { useCallback, useEffect, useRef } from 'react';
import { useVersion } from '../context/VersionContext';
import { useItinerary } from '../context/ItineraryContext';
import type { ChangeType } from '../types/version';

/* ========================================
   useVersionHistory Hook
   ======================================== */

export function useVersionHistory() {
  const { state, dispatch, generateSnapshot, rollbackToVersion } = useVersion();
  const { state: itineraryState, dispatch: itineraryDispatch } = useItinerary();
  const initializedRef = useRef(false);

  /**
   * 初始加载时生成 v1 快照
   */
  useEffect(() => {
    if (initializedRef.current) return;
    if (!itineraryState.current) return;
    initializedRef.current = true;

    generateSnapshot(
      itineraryState.current.id,
      itineraryState.current,
      'initial',
      '初始生成攻略'
    );
  }, [itineraryState.current, generateSnapshot]);

  /**
   * 手动生成快照（供编辑/AI调整后调用）
   */
  const createSnapshot = useCallback(
    (changeType: ChangeType, changeSummary: string) => {
      if (!itineraryState.current) return;
      generateSnapshot(
        itineraryState.current.id,
        itineraryState.current,
        changeType,
        changeSummary
      );
    },
    [itineraryState.current, generateSnapshot]
  );

  /**
   * 回退到指定版本
   */
  const rollback = useCallback(
    (targetVersionNumber: number) => {
      if (!itineraryState.current) return;

      const allVersions = state.versions;
      const newSnapshot = rollbackToVersion(targetVersionNumber, allVersions);

      if (newSnapshot) {
        // 恢复攻略数据
        try {
          const restoredData = JSON.parse(newSnapshot.data);
          itineraryDispatch({
            type: 'SET_ITINERARY',
            payload: restoredData,
          });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    },
    [itineraryState.current, itineraryDispatch, state.versions, rollbackToVersion]
  );

  /**
   * 回退到上一版本
   */
  const rollbackToPrevious = useCallback(() => {
    if (state.currentVersionNumber <= 1) return false;
    const target = state.currentVersionNumber - 1;
    return rollback(target);
  }, [state.currentVersionNumber, rollback]);

  return {
    versions: state.versions,
    currentVersionNumber: state.currentVersionNumber,
    createSnapshot,
    rollback,
    rollbackToPrevious,
  };
}