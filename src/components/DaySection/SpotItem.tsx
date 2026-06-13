import { useState, useRef, useEffect } from 'react';
import type { Spot } from '../../types/itinerary';
import { TRANSPORT_ICONS } from '../../types/itinerary';
import TransportLine from './TransportLine';
import styles from './DaySection.module.css';

interface SpotItemProps {
  spot: Spot;
  showTransport?: boolean;
  onEdit?: (spot: Spot) => void;
  onDelete?: (spotId: string) => void;
  onFieldChange?: (spotId: string, field: string, value: string) => void;
  dragHandle?: React.ReactNode;
}

export default function SpotItem({
  spot,
  showTransport = true,
  onEdit,
  onDelete,
  onFieldChange,
  dragHandle,
}: SpotItemProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLInputElement | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTransit = spot.isTransit === true;

  useEffect(() => {
    if (editingField && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingField]);

  const handleStartEdit = (field: string, currentValue: string) => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleFinishEdit = () => {
    if (editingField && onFieldChange && editValue.trim()) {
      onFieldChange(spot.id, editingField, editValue.trim());
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleBlur = () => {
    // 防抖 300ms 保存
    blurTimerRef.current = setTimeout(() => {
      handleFinishEdit();
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      handleFinishEdit();
    }
    if (e.key === 'Escape') {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      setEditingField(null);
    }
  };

  return (
    <>
      {showTransport && spot.transport && (
        <TransportLine mode={spot.transport.mode} duration={spot.transport.duration} />
      )}
      <div className={`${styles.spotCard} ${isTransit ? styles.transitCard : ''}`}>
        {dragHandle && <div className={styles.dragHandle}>{dragHandle}</div>}

        <div className={styles.spotHeader}>
          <div className={styles.spotTitleArea}>
            {editingField === 'name' ? (
              <input
                ref={editRef}
                className={styles.inlineInput}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
              />
            ) : (
              <h4
                className={styles.spotName}
                onClick={() => handleStartEdit('name', spot.name)}
                title="点击编辑名称"
              >
                {spot.name}
              </h4>
            )}
          </div>
          <div className={styles.spotHeaderRight}>
            {editingField === 'duration' ? (
              <input
                ref={editRef}
                className={`${styles.inlineInput} ${styles.inlineInputSmall}`}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
              />
            ) : (
              <span
                className={styles.spotDuration}
                onClick={() => handleStartEdit('duration', spot.duration)}
                title="点击编辑时长"
              >
                ⏱ 预计游玩时间：{spot.duration}
              </span>
            )}
          </div>
        </div>

        {editingField === 'description' ? (
          <input
            ref={editRef}
            className={styles.inlineInput}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ width: '100%', marginBottom: '4px' }}
          />
        ) : (
          <p
            className={styles.spotDesc}
            onClick={() => handleStartEdit('description', spot.description)}
            title="点击编辑描述"
          >
            {spot.description}
          </p>
        )}

        {/* 推荐理由 */}
        {spot.recommendReason && (
          <div className={styles.recommendBox}>
            <span className={styles.recommendIcon}>💡</span>
            <p className={styles.recommendText}>{spot.recommendReason}</p>
          </div>
        )}

        <div className={styles.spotFooter}>
          <div className={styles.spotFooterLeft}>
            {/* 门票信息 */}
            {spot.ticketInfo && (
              <span className={`${styles.ticketBadge} ${spot.ticketInfo.type === '免费' ? styles.ticketFree : styles.ticketPaid}`}>
                🎫 {spot.ticketInfo.type === '免费' ? '免费开放' : `门票 ${spot.ticketInfo.price || '收费'}`}
              </span>
            )}
            {spot.tags && spot.tags.length > 0 && (
              <div className={styles.spotTags}>
                {spot.tags.map((tag) => (
                  <span key={tag} className={styles.spotTag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 编辑/删除按钮 — 悬浮显示 */}
          <div className={styles.spotActions}>
            {onEdit && (
              <button
                className={styles.spotActionBtn}
                onClick={() => onEdit(spot)}
                title="编辑景点"
              >
                ✎
              </button>
            )}
            {onDelete && (
              <button
                className={`${styles.spotActionBtn} ${styles.spotDeleteBtn}`}
                onClick={() => onDelete(spot.id)}
                title="删除景点"
              >
                🗑
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}