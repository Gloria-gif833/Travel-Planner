import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItinerary } from '../context/ItineraryContext';
import { updateItinerary } from '../services/itineraryService';
import { useItineraryEditor } from '../hooks/useItineraryEditor';
import { useVersionHistory } from '../hooks/useVersionHistory';
import ItineraryHeader from '../components/ItineraryHeader/ItineraryHeader';
import DaySection from '../components/DaySection/DaySection';
import InfoPanel from '../components/InfoPanel/InfoPanel';
import NoticeBox from '../components/NoticeBox/NoticeBox';
import SpotEditModal from '../components/SpotEditModal/SpotEditModal';
import AiAdjustDrawer from '../components/AiAdjustPanel/AiAdjustDrawer';
import VersionHistoryModal from '../components/VersionHistoryModal/VersionHistoryModal';
import EmptyGuideModal from '../components/EmptyGuideModal/EmptyGuideModal';
import { DragProvider } from '../components/DaySection/DragContext';
import type { Spot } from '../types/itinerary';
import { diffItinerary } from '../utils/diffItinerary';
import styles from '../styles/itinerary.module.css';

export default function ItineraryPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useItinerary();
  const editor = useItineraryEditor();

  // 编辑弹窗状态
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);

  // 版本历史弹窗
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  // AI调整抽屉
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const { createSnapshot } = useVersionHistory();
  const prevItineraryRef = useRef<string>('');
  const [pendingAdd, setPendingAdd] = useState<{ dayIndex: number; slotIndex: number } | null>(null);

  const itinerary = state.current;
  const isLoading = state.loading;

  // 当攻略数据变化时自动生成版本快照（使用 diff 工具生成可读摘要）
  useEffect(() => {
    if (!itinerary) return;
    const currentJson = JSON.stringify({ days: itinerary.days, practicalInfo: itinerary.practicalInfo });
    if (prevItineraryRef.current && prevItineraryRef.current !== currentJson) {
      try {
        const { days: oldDays } = JSON.parse(prevItineraryRef.current);
        const oldItin = { ...itinerary, days: oldDays };
        const { summary } = diffItinerary(oldItin, itinerary);
        createSnapshot('manual', summary || '编辑了攻略内容');
      } catch {
        createSnapshot('manual', '编辑了攻略内容');
      }
    }
    prevItineraryRef.current = currentJson;
  }, [itinerary?.days, itinerary?.practicalInfo]);

  // 编辑后自动保存到数据库（2 秒防抖）
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!itinerary?.id) return;
    // 跳过首次加载（避免初始化时触发保存）
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaving(true);
      updateItinerary(itinerary.id, { title: itinerary.title, data: itinerary, summary: '' })
        .finally(() => setSaving(false));
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [itinerary?.days, itinerary?.practicalInfo]);

  const handleManualSave = useCallback(async () => {
    if (!itinerary?.id) return;
    setSaving(true);
    try {
      await updateItinerary(itinerary.id, { title: itinerary.title, data: itinerary, summary: '' });
    } finally {
      setSaving(false);
    }
  }, [itinerary]);

  // 加载中：显示等待提示
  const showLoading = isLoading && !itinerary;

  // 空状态（既非加载中，也没有有效攻略数据）
  const isEmpty = (!itinerary || !itinerary.days) && !isLoading;

  /** 打开编辑弹窗（编辑模式） */
  const handleEditSpot = useCallback((spot: Spot) => {
    setEditingSpot(spot);
    setEditModalOpen(true);
  }, []);

  /** 打开编辑弹窗（新建模式 — 添加到指定时段） */
  const handleAddSpot = useCallback(
    (dayIndex: number, slotIndex: number) => {
      const newSpot: Spot = {
        id: '',
        name: '',
        description: '',
        duration: '1小时',
        tags: [],
      };
      setEditingSpot(null);
      setPendingAdd({ dayIndex, slotIndex });
      void newSpot; // referenced for future use
      setEditModalOpen(true);
    },
    []
  );

  /** 保存弹窗内容 */
  const handleSaveSpot = useCallback(
    (spot: Spot) => {
      if (pendingAdd) {
        // 新建模式
        editor.addSpot(pendingAdd.dayIndex, pendingAdd.slotIndex, spot);
        setPendingAdd(null);
      } else if (editingSpot) {
        // 编辑模式
        editor.updateSpot(editingSpot.id, spot);
      }
    },
    [editor, editingSpot, pendingAdd]
  );

  /** 删除景点 */
  const handleDeleteSpot = useCallback(
    (spotId: string) => {
      editor.deleteSpot(spotId);
    },
    [editor]
  );

  /** 原地编辑 */
  const handleFieldChange = useCallback(
    (spotId: string, field: string, value: string) => {
      editor.updateSpotField(spotId, field, value);
    },
    [editor]
  );

  /** 添加时段 */
  const handleAddSlot = useCallback(
    (dayIndex: number) => {
      editor.addSlot(dayIndex);
    },
    [editor]
  );

  /** 添加天数 */
  const handleAddDay = useCallback(() => {
    editor.addDay();
  }, [editor]);

  /** 拖拽排序 */
  const handleReorder = useCallback(
    (fromId: string, toId: string) => {
      const fromIdx = editor.findSpotIndex(fromId);
      const toIdx = editor.findSpotIndex(toId);
      if (
        fromIdx &&
        toIdx &&
        fromIdx.dayIndex === toIdx.dayIndex &&
        fromIdx.slotIndex === toIdx.slotIndex
      ) {
        editor.reorderSpots(
          fromIdx.dayIndex,
          fromIdx.slotIndex,
          fromIdx.spotIndex,
          toIdx.spotIndex
        );
      }
    },
    [editor]
  );

  /** 拖拽手柄 */
  const dragHandle = useCallback(() => {
    return <span style={{ cursor: 'grab', fontSize: 14, color: '#C8C8C8' }}>⋮⋮</span>;
  }, []);

  return (
    <DragProvider onReorder={handleReorder}>
      <div className={styles.container}>
        {showLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingContent}>
                <div className={styles.loadingSpinner}></div>
                <h2 className={styles.loadingTitle}>稍等一会儿哦~</h2>
                <p className={styles.loadingText}>请不要离开，攻略正在快马加鞭生成中 🏃‍♂️💨</p>
              </div>
            </div>
          ) : isEmpty ? (
          <EmptyGuideModal />
        ) : (<>
        {/* 顶部操作栏 */}
        <div className={styles.topBar}>
          <button className={styles.backButton} onClick={() => navigate('/')}>
            ← 返回上一页
          </button>
          <div className={styles.actionButtons}>
            <button className={styles.actionButton} onClick={() => setVersionModalOpen(true)}>🕐 版本历史</button>
            <button className={styles.actionButton} onClick={() => navigate('/export')}>📥 导出文档</button>
            <button
              className={styles.actionButton}
              onClick={handleManualSave}
              disabled={!itinerary?.id}
              title="手动保存到数据库"
            >
              {saving ? '⏳ 保存中...' : '💾 保存'}
            </button>
            <span className={styles.editHint}>✎ 原地点击即可编辑</span>
          </div>
        </div>

        {/* 主体布局 */}
        <div className={styles.body}>
          {/* 左侧：攻略内容 */}
          <div className={styles.mainContent}>
            <ItineraryHeader itinerary={itinerary!} />
            <div className={styles.dayList}>
              {itinerary?.days?.map((day, idx) => (
                <DaySection
                  key={day.dayNumber}
                  day={day}
                  dayIndex={idx}
                  defaultExpanded={day.dayNumber === 1}
                  onEditSpot={handleEditSpot}
                  onDeleteSpot={handleDeleteSpot}
                  onFieldChange={handleFieldChange}
                  onAddSpot={handleAddSpot}
                  onAddSlot={handleAddSlot}
                  dragHandle={dragHandle}
                />
              ))}
              {/* 添加新的一天 */}
              <button className={styles.addDayButton} onClick={handleAddDay}>
                + 添加新的一天
              </button>
            </div>
          </div>

          {/* 右侧：实用信息 */}
          <div className={styles.sidePanel}>
            <InfoPanel
              info={itinerary!.practicalInfo}
              onUpdate={(field, value, userNote) =>
                dispatch({ type: 'UPDATE_PRACTICAL_INFO', payload: { field, value, userNote } })
              }
            />
            <NoticeBox notices={itinerary!.notices} />
          </div>
        </div>

        {/* AI 调整浮动按钮 */}
        <button
          className={styles.aiFab}
          onClick={() => setAiDrawerOpen(true)}
          title="AI 攻略调整"
        >
          <span className={styles.aiFabIcon}>💬</span>
          <span className={styles.aiFabLabel}>AI调整</span>
        </button>

        {/* AI 调整侧滑面板 */}
        <AiAdjustDrawer
          open={aiDrawerOpen}
          onClose={() => setAiDrawerOpen(false)}
        />

        {/* 景点编辑弹窗 */}
        <SpotEditModal
          open={editModalOpen}
          spot={pendingAdd ? null : editingSpot}
          onClose={() => {
            setEditModalOpen(false);
            setPendingAdd(null);
          }}
          onSave={handleSaveSpot}
        />

        {/* 版本历史弹窗 */}
        <VersionHistoryModal
          open={versionModalOpen}
          onClose={() => setVersionModalOpen(false)}
        />
        </>)}
      </div>
    </DragProvider>
  );
}