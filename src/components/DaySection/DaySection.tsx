import { useState } from 'react';
import type { Day, Spot } from '../../types/itinerary';
import TimeSlot from './TimeSlot';
import styles from './DaySection.module.css';

interface DaySectionProps {
  day: Day;
  dayIndex: number;
  defaultExpanded?: boolean;
  onEditSpot?: (spot: Spot) => void;
  onDeleteSpot?: (spotId: string) => void;
  onFieldChange?: (spotId: string, field: string, value: string) => void;
  onAddSpot?: (dayIndex: number, slotIndex: number) => void;
  onAddSlot?: (dayIndex: number) => void;
  dragHandle?: (spotId: string) => React.ReactNode;
}

export default function DaySection({
  day,
  dayIndex,
  defaultExpanded = false,
  onEditSpot,
  onDeleteSpot,
  onFieldChange,
  onAddSpot,
  onAddSlot,
  dragHandle,
}: DaySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`${styles.day} ${expanded ? styles.expanded : ''}`}>
      <button
        className={styles.dayHeader}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className={styles.dayInfo}>
          <span className={styles.dayNumber}>Day {day.dayNumber}</span>
          <span className={styles.dayTitle}>{day.title}</span>
          <span className={styles.daySpots}>
            {day.slots.reduce((sum, s) => sum + s.spots.length, 0)} 个景点
          </span>
        </div>
        <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>
          ▶
        </span>
      </button>

      {expanded && (
        <div className={styles.dayBody}>
          {day.slots.map((slot, idx) => (
            <TimeSlot
              key={slot.id}
              slot={slot}
              dayIndex={dayIndex}
              slotIndex={idx}
              onEditSpot={onEditSpot}
              onDeleteSpot={onDeleteSpot}
              onFieldChange={onFieldChange}
              onAddSpot={onAddSpot}
              dragHandle={dragHandle}
            />
          ))}

          {/* 添加时段按钮 */}
          {onAddSlot && (
            <button
              className={styles.addButton}
              onClick={() => onAddSlot(dayIndex)}
            >
              + 添加时段
            </button>
          )}

          {day.tips && day.tips.length > 0 && (
            <div className={styles.dayTips}>
              <span className={styles.tipsIcon}>💡</span>
              <div className={styles.tipsList}>
                {day.tips.map((tip, i) => (
                  <p key={i} className={styles.tipItem}>{tip}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}