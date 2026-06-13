import type { ItineraryData } from '../../types/itinerary';
import styles from './ItineraryHeader.module.css';

interface ItineraryHeaderProps {
  itinerary: ItineraryData;
}

/** 从 metadata 中提取同行人员展示文案 */
function getCompanionLabel(companions?: string): string | null {
  if (!companions) return null;
  if (companions.includes('独自') || companions.includes('一个人')) return '独自出行';
  if (companions.includes('情侣') || companions.includes('两个人') || companions.includes('二人')) return '情侣出行';
  if (companions.includes('家人') || companions.includes('父母') || companions.includes('爸妈') || companions.includes('家庭') || companions.includes('全家')) return '家庭出行';
  if (companions.includes('亲子') || companions.includes('带娃') || companions.includes('小孩')) return '亲子出行';
  if (companions.includes('朋友') || companions.includes('闺蜜') || companions.includes('兄弟') || companions.includes('同学') || companions.includes('同事') || companions.includes('团建')) return '朋友结伴';
  return companions;
}

/** 提取纯粹的偏好文字（去掉缓存的预算数字等） */
function getPreferenceLabel(preferences?: string): string | null {
  if (!preferences) return null;
  // 过滤掉可能混入的预算数字
  const cleaned = preferences.replace(/人均\d+元[×xX]\d+人≈\d+元/g, '').replace(/^\s*[、，,]\s*/, '').replace(/\s*[、，,]\s*$/, '');
  return cleaned || preferences;
}

export default function ItineraryHeader({ itinerary }: ItineraryHeaderProps) {
  const totalBudget =
    (itinerary.practicalInfo.budget.transport || 0) +
    (itinerary.practicalInfo.budget.hotel || 0) +
    (itinerary.practicalInfo.budget.food || 0) +
    (itinerary.practicalInfo.budget.tickets || 0) +
    (itinerary.practicalInfo.budget.other || 0);

  const meta = itinerary.metadata;

  return (
    <div className={styles.header}>
      <h2 className={styles.title}>🗺 {itinerary.title}</h2>
      <div className={styles.metaList}>
        <span className={styles.meta}>
          <span className={styles.metaIcon}>📅</span>
          {itinerary.days?.length ?? 0}天
        </span>
        {totalBudget > 0 && (
          <span className={styles.meta}>
            <span className={styles.metaIcon}>💰</span>
            约 ¥{totalBudget.toLocaleString()} <span className={styles.perPersonTag}>/人</span>
          </span>
        )}
        {getCompanionLabel(meta?.companions) && (
          <span className={styles.meta}>
            <span className={styles.metaIcon}>👥</span>
            {getCompanionLabel(meta?.companions)}
          </span>
        )}
        {meta?.travelDate && (
          <span className={styles.meta}>
            <span className={styles.metaIcon}>🗓️</span>
            {meta.travelDate}出发
          </span>
        )}
        {getPreferenceLabel(meta?.preferences) && (
          <span className={styles.meta}>
            <span className={styles.metaIcon}>🏷️</span>
            {getPreferenceLabel(meta?.preferences)}
          </span>
        )}
      </div>
    </div>
  );
}