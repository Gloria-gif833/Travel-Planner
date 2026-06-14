import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useItinerary } from '../../context/ItineraryContext';
import { fetchItineraryById, deleteItinerary as deleteFromDb } from '../../services/itineraryService';
import styles from './MyItinerariesPanel.module.css';

interface MyItinerariesPanelProps {
  onNavigate?: () => void;
}

export default function MyItinerariesPanel({ onNavigate }: MyItinerariesPanelProps) {
  const { state, dispatch } = useItinerary();
  const navigate = useNavigate();
  const location = useLocation();

  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleSwitch = async (id: string) => {
    // 如果列表项没有完整 data，从数据库加载
    const cached = state.list.find(i => i.id === id);
    if (cached && cached.days) {
      // 已有完整数据，直接切换
      dispatch({ type: 'SWITCH_ITINERARY', payload: id });
    } else {
      // 从数据库加载完整数据
      const full = await fetchItineraryById(id);
      if (full?.data) {
        // 后端返回：full = { id, guest_id, title, data: {title, days, ...}, summary }
        // full.data 就是攻略内容对象，需要把 id 合并到顶层
        const normalized = { ...full.data, id: full.id };
        if (normalized.days) {
          dispatch({ type: 'SET_ITINERARY', payload: normalized });
          dispatch({ type: 'ADD_TO_LIST', payload: normalized });
        }
      }
    }
    if (location.pathname !== '/itinerary') {
      navigate('/itinerary');
    }
    onNavigate?.();
  };

  const handleDelete = async (id: string) => {
    if (confirmingId === id) {
      const isCurrentDeleted = state.current?.id === id;
      // 先删数据库
      await deleteFromDb(id);
      // 再删前端
      dispatch({ type: 'DELETE_ITINERARY', payload: id });
      setConfirmingId(null);
      if (isCurrentDeleted && location.pathname === '/itinerary') {
        navigate('/itinerary', { replace: true });
      }
    } else {
      setConfirmingId(id);
    }
  };

  const cancelDelete = () => {
    setConfirmingId(null);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4 className={styles.title}>📂 我的攻略</h4>
        <span className={styles.count}>{state.list.length}</span>
      </div>

      <div className={styles.list}>
        {state.list.map((item) => {
          const isCurrent = state.current?.id === item.id;
          const totalSpots = item.days?.reduce(
            (sum, d) => sum + (d.slots?.reduce((s, sl) => s + (sl.spots?.length || 0), 0) || 0),
            0
          ) || 0;

          return (
            <div
              key={item.id}
              className={`${styles.itemWrapper} ${isCurrent ? styles.currentItem : ''}`}
            >
              <button
                className={styles.item}
                onClick={() => handleSwitch(item.id)}
              >
                <span className={styles.itemIcon}>{isCurrent ? '🗺' : '📋'}</span>
                <div className={styles.itemContent}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemMeta}>
                    {item.days?.length ?? 0} 天 · {totalSpots} 个景点
                  </span>
                </div>
                {isCurrent && <span className={styles.currentDot}>●</span>}
              </button>

              <div className={styles.itemActions}>
                {confirmingId === item.id ? (
                  <div className={styles.confirmBox}>
                    <button
                      className={`${styles.actionBtn} ${styles.confirmDeleteBtn}`}
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      title="确认删除"
                    >
                      ✓
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.cancelBtn}`}
                      onClick={(e) => { e.stopPropagation(); cancelDelete(); }}
                      title="取消"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={(e) => { e.stopPropagation(); setConfirmingId(item.id); }}
                    title="删除攻略"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}