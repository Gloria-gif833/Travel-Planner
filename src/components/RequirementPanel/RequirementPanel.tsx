import type { Requirements, RequirementKey } from '../../types/conversation';
import { REQUIREMENT_FIELDS } from '../../types/conversation';
import styles from './RequirementPanel.module.css';

interface RequirementPanelProps {
  requirements: Requirements;
  completedKeys: RequirementKey[];
  progress: number;
  canGenerate: boolean;
  onGenerate?: () => void;
}

export default function RequirementPanel({
  requirements,
  completedKeys,
  progress,
  canGenerate,
  onGenerate,
}: RequirementPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>📋 需求搜集</h3>
        <span className={styles.progressText}>{progress}%</span>
      </div>

      {/* 进度条 */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 需求标签列表 */}
      <div className={styles.tagList}>
        {REQUIREMENT_FIELDS.map((field) => {
          const isCompleted = completedKeys.includes(field.key);
          const value = requirements[field.key];

          return (
            <div
              key={field.key}
              className={`${styles.tag} ${isCompleted ? styles.tagCompleted : styles.tagEmpty}`}
            >
              <span className={styles.tagIcon}>{isCompleted ? '✅' : '⏳'}</span>
              <div className={styles.tagContent}>
                <span className={styles.tagLabel}>{field.label}</span>
                <span className={styles.tagValue}>
                  {isCompleted ? value : field.placeholder}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 生成攻略按钮 */}
      <button
        className={styles.generateButton}
        disabled={!canGenerate}
        onClick={onGenerate}
      >
        {canGenerate ? '✨ 生成攻略' : `完成前6项以后再制定攻略哦 (${completedKeys.length}/${REQUIREMENT_FIELDS.length})`}
      </button>
    </div>
  );
}