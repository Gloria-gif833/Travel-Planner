import { useState } from 'react';
import { useVersionHistory } from '../../hooks/useVersionHistory';
import type { VersionSnapshot } from '../../types/version';
import styles from './VersionHistoryModal.module.css';

interface VersionHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

/** 修改类型对应的展示文案 */
function getChangeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    initial: '初始生成',
    manual: '手动编辑',
    ai_adjust: 'AI 调整',
  };
  return map[type] ?? type;
}

/** 格式化时间 */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${min}`;
}

export default function VersionHistoryModal({ open, onClose }: VersionHistoryModalProps) {
  const { versions, currentVersionNumber, rollback } =
    useVersionHistory();

  const [confirmTarget, setConfirmTarget] = useState<number | null>(null);

  if (!open) return null;

  /** 执行回退 */
  const handleRollback = (versionNumber: number) => {
    const success = rollback(versionNumber);
    if (success) {
      setConfirmTarget(null);
    }
  };

  /** 获取版本摘要描述 */
  const getVersionSummary = (v: VersionSnapshot) => {
    if (v.changeSummary.startsWith('回退到版本')) {
      return v.changeSummary;
    }
    return v.changeSummary || getChangeTypeLabel(v.changeType);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className={styles.header}>
          <h3 className={styles.title}>🕐 版本历史</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 时间线 */}
        <div className={styles.body}>
          {versions.length === 0 ? (
            <div className={styles.empty}>
              <p>暂无版本记录</p>
            </div>
          ) : (
            <div className={styles.timeline}>
              {[...versions].reverse().map((v) => {
                const isCurrent = v.versionNumber === currentVersionNumber;
                const isConfirming = confirmTarget === v.versionNumber;

                return (
                  <div
                    key={v.id}
                    className={`${styles.timelineItem} ${isCurrent ? styles.current : ''}`}
                  >
                    {/* 时间线节点 */}
                    <div className={styles.timelineDot}>
                      <div className={`${styles.dot} ${isCurrent ? styles.dotCurrent : ''}`} />
                    </div>

                    {/* 内容 */}
                    <div className={styles.timelineContent}>
                      <div className={styles.versionHeader}>
                        <span className={styles.versionNumber}>
                          v{v.versionNumber}
                        </span>
                        <span className={`${styles.versionTag} ${styles[`tag_${v.changeType}`]}`}>
                          {getChangeTypeLabel(v.changeType)}
                        </span>
                        {isCurrent && (
                          <span className={styles.currentBadge}>当前版本</span>
                        )}
                      </div>
                      <p className={styles.versionSummary}>
                        {getVersionSummary(v)}
                      </p>
                      <span className={styles.versionTime}>
                        {formatTime(v.createdAt)}
                      </span>

                      {/* 操作按钮 */}
                      {!isCurrent && (
                        <div className={styles.versionActions}>
                          {isConfirming ? (
                            <div className={styles.confirmBox}>
                              <span className={styles.confirmText}>
                                回退到 v{v.versionNumber}？
                              </span>
                              <button
                                className={`${styles.actionBtn} ${styles.confirmBtn}`}
                                onClick={() => handleRollback(v.versionNumber)}
                              >
                                确认回退
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.cancelBtn}`}
                                onClick={() => setConfirmTarget(null)}
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <button
                              className={`${styles.actionBtn} ${styles.rollbackBtn}`}
                              onClick={() => setConfirmTarget(v.versionNumber)}
                            >
                              回退到此版本
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className={styles.footer}>
          {currentVersionNumber > 1 && (
            <button
              className={styles.previousBtn}
              onClick={() => {
                const target = currentVersionNumber - 1;
                setConfirmTarget(target);
              }}
            >
              ↩ 回退到上一版本 (v{currentVersionNumber - 1})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}